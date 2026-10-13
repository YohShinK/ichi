#!/usr/bin/env node
import "./network-workflow/source-loader.mjs";
import { BatchStore, json, check } from "./network-workflow/store.mjs";

const output = process.stdout.write.bind(process.stdout);
// Provider tooling must never send raw authentication diagnostics to the user.
for (const level of ["log", "warn", "error", "info", "debug"])
  console[level] = () => {};
process.stdout.write = () => true;
process.stderr.write = () => true;
const print = (value) => output(JSON.stringify(value, null, 2) + "\n");
const args = process.argv.slice(2),
  command = args.shift(),
  options = {};
for (let i = 0; i < args.length; i++) {
  check(args[i].startsWith("--"), "NAMED_ARGUMENTS_REQUIRED");
  const key = args[i].slice(2);
  check(!Object.hasOwn(options, key), "DUPLICATE_ARGUMENT");
  options[key] =
    args[i + 1] && !args[i + 1].startsWith("--") ? args[++i] : true;
}
let adapter;
try {
  check(
    options.execute === undefined || options.execute === true,
    "EXECUTE_MUST_BE_EXPLICIT_FLAG",
  );
  check(
    options.pending === undefined || options.pending === true,
    "PENDING_MUST_BE_EXPLICIT_FLAG",
  );
  if (!command || command === "help" || command === "--help") {
    print({
      commands: [
        "collect --manifest FILE",
        "auto-review --recognition FILE --grant FILE",
        "review [--pending | --decisions FILE]",
        "fix --fixes FILE",
        "edit --id ID --replacement FILE",
        "publish --config FILE [--execute --grant FILE | --authorization FILE]",
        "resume --config FILE",
        "correct --config FILE --ids ID [--execute --authorization FILE]",
        "withdraw --config FILE --ids ID,ID [--execute --authorization FILE]",
        "run --manifest FILE --recognition FILE --grant FILE --config FILE",
        "status [--config FILE]",
        "recover-lock",
      ],
      required: "--batch DIRECTORY",
      defaultPublication: "PLAN_ONLY",
      automaticMode: "AUTO_CLEAR_ESCALATE_UNCERTAIN",
    });
  } else {
    check(typeof options.batch === "string", "BATCH_DIRECTORY_REQUIRED");
    const store = new BatchStore(options.batch);
    const workflow = await import("./network-workflow/workflow.mjs");
    const { renderReview } = await import("./network-workflow/review-page.mjs");
    const ids =
      typeof options.ids === "string" ? options.ids.split(",") : undefined;
    const getAdapter = async () => {
      check(typeof options.config === "string", "CONFIG_FILE_REQUIRED");
      const config = json(options.config);
      const { createCloudBaseAdapter } =
        await import("./network-workflow/cloudbase.mjs");
      adapter = await createCloudBaseAdapter(config);
      return adapter;
    };
    if (command === "collect")
      print(await workflow.collect(store, options.manifest));
    else if (command === "auto-review") {
      print(
        await workflow.autoReview(store, options.recognition, options.grant),
      );
      print(renderReview(store, true));
    } else if (command === "review")
      print(
        options.decisions
          ? await workflow.review(store, options.decisions)
          : renderReview(store, options.pending === true),
      );
    else if (command === "fix")
      print(await workflow.applyFounderFixes(store, options.fixes));
    else if (command === "edit")
      print(await workflow.edit(store, options.id, options.replacement));
    else if (command === "recover-lock") {
      store.recoverLock();
      print({ status: "DEAD_PROCESS_LOCK_RECOVERED" });
    } else if (command === "publish") {
      const remote = await getAdapter();
      if (options.execute)
        print(
          await workflow.publish(
            store,
            remote,
            json(options.grant ?? options.authorization),
            ids,
          ),
        );
      else {
        const plan = { ...(await workflow.preparePublish(store, remote, ids)) };
        delete plan.candidates;
        delete plan.desiredPolicy;
        print(plan);
      }
    } else if (command === "correct") {
      const remote = await getAdapter();
      if (options.execute)
        print(
          await workflow.correct(
            store,
            remote,
            json(options.authorization),
            ids,
          ),
        );
      else {
        const plan = {
          ...(await workflow.prepareCorrection(store, remote, ids)),
        };
        delete plan.candidates;
        delete plan.desiredPolicy;
        print(plan);
      }
    } else if (command === "resume")
      print(await workflow.resume(store, await getAdapter(), ids));
    else if (command === "withdraw") {
      const remote = await getAdapter();
      print(
        options.execute
          ? await workflow.withdraw(
              store,
              remote,
              json(options.authorization),
              ids,
            )
          : await workflow.prepareWithdrawal(store, remote, ids),
      );
    } else if (command === "run") {
      print(await workflow.collect(store, options.manifest));
      print(
        await workflow.autoReview(store, options.recognition, options.grant),
      );
      print(renderReview(store, true));
      const ready = Object.values(store.read().candidates)
        .filter((c) => c.status === "APPROVED")
        .map((c) => c.id);
      print(
        ready.length
          ? await workflow.publish(
              store,
              await getAdapter(),
              json(options.grant),
              ready,
            )
          : { status: "ONLY_FOUNDER_PENDING_NO_PUBLICATION", cloudWrites: 0 },
      );
    } else if (command === "status") {
      const state = store.read();
      print({
        revision: state.revision,
        states: Object.fromEntries(
          Object.entries(state.candidates).map(([id, c]) => [
            id,
            {
              status: c.status,
              revision: c.revision,
              issues: c.issues,
              publicLeadId: c.publication?.publicLeadId ?? null,
            },
          ]),
        ),
      });
      if (options.config) print(await (await getAdapter()).readInventory());
    } else check(false, "UNKNOWN_COMMAND");
  }
} catch (error) {
  print({
    status: "STOPPED",
    code: /^[A-Z0-9_:-]+$/u.test(error.code ?? "")
      ? error.code
      : "WORKFLOW_ERROR",
    cloudSuccessNotAssumed: true,
  });
  process.exitCode = 1;
} finally {
  if (adapter) await adapter.closeReader();
}
