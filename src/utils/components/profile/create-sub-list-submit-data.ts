export function createSubListSubmitData(
  form: Record<string, string>,
  currentlyHereKey: string | undefined,
  currentlyHere: boolean,
) {
  const data: Record<string, unknown> = { ...form };

  if (currentlyHereKey) {
    data[currentlyHereKey] = currentlyHere;
    if (currentlyHere) data.endDate = null;
  }

  return data;
}
