const SHANGHAI_CENTER = Object.freeze({
  latitude: 31.2304,
  longitude: 121.4737,
});

const LATITUDE_OFFSETS = [-0.06, -0.036, -0.012, 0.012, 0.036];
const LONGITUDE_OFFSETS = [-0.075, -0.045, -0.015, 0.015, 0.045, 0.075];

const SYNTHETIC_RECORDS = Object.freeze(
  LATITUDE_OFFSETS.flatMap((latitudeOffset, row) =>
    LONGITUDE_OFFSETS.map((longitudeOffset, column) => {
      const sequence = row * LONGITUDE_OFFSETS.length + column + 1;
      return Object.freeze({
        id: sequence,
        publicLeadId: `synthetic-shanghai-${String(sequence).padStart(2, "0")}`,
        title: `上海合成点 ${String(sequence).padStart(2, "0")}`,
        latitude: Number(
          (SHANGHAI_CENTER.latitude + latitudeOffset).toFixed(6),
        ),
        longitude: Number(
          (SHANGHAI_CENTER.longitude + longitudeOffset).toFixed(6),
        ),
        sourceType: "SYNTHETIC_ONLY",
        verificationState: "SYNTHETIC_FIXTURE",
        observedAt: "2026-09-10T00:00:00.000Z",
      });
    }),
  ),
);

function toMapMarker(record) {
  return {
    id: record.id,
    latitude: record.latitude,
    longitude: record.longitude,
    title: record.title,
    iconPath: "/assets/marker.png",
    width: 28,
    height: 34,
    anchor: { x: 0.5, y: 1 },
    callout: {
      content: record.title,
      display: "BYCLICK",
      color: "#111111",
      bgColor: "#ffffff",
      borderColor: "#111111",
      borderWidth: 1,
      borderRadius: 8,
      padding: 6,
      fontSize: 12,
    },
  };
}

function filterByViewport(records, viewport) {
  if (!viewport) return records.slice();
  return records.filter(
    (record) =>
      record.latitude >= viewport.southwest.latitude &&
      record.latitude <= viewport.northeast.latitude &&
      record.longitude >= viewport.southwest.longitude &&
      record.longitude <= viewport.northeast.longitude,
  );
}

module.exports = {
  SHANGHAI_CENTER,
  SYNTHETIC_RECORDS,
  filterByViewport,
  toMapMarker,
};
