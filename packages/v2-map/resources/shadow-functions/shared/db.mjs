export const readDoc = async (collection, id) => {
  if (typeof id !== "string" || id.length === 0 || id.length > 256) {
    return null;
  }
  try {
    const value = (await collection.doc(id).get())?.data;
    if (!value || typeof value !== "object" || Array.isArray(value))
      return null;
    const document = { ...value };
    delete document._id;
    return document;
  } catch (error) {
    if (/not exist|not found|-502005/u.test(String(error?.message || error))) {
      return null;
    }
    throw error;
  }
};

export const listData = (result) =>
  Array.isArray(result?.data) ? result.data : [];

export const fixedId = (prefix, value) => {
  if (typeof value !== "string" || value.length === 0 || value.length > 180) {
    return null;
  }
  return `${prefix}:${value}`;
};

export const positiveInteger = (value) =>
  Number.isSafeInteger(value) && value > 0 ? value : null;
