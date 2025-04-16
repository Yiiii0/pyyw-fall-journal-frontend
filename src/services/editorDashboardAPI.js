export async function getEditorDashboardStatus(email) {
  const url = `/dev/editor_dashboard?email=${encodeURIComponent(email)}`;
  const response = await fetch(url, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to fetch dashboard status: ${errorText}`);
  }

  return response.json();
}
