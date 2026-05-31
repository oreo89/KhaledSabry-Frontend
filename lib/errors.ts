export const GENERIC_ERROR_MESSAGE = "Something went wrong. Please try again.";

export function getPublicErrorMessage(fallback = GENERIC_ERROR_MESSAGE) {
  return fallback;
}
