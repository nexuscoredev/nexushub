/** Hub P1..P4 (1=urgente). Conversão com API Todoist feita no servidor. */
export function todoistApiPriorityToHub(apiPriority: number): number {
  const p = Math.min(4, Math.max(1, Math.round(apiPriority)));
  return 5 - p;
}

export function hubPriorityToTodoistApi(hubPriority: number): number {
  const p = Math.min(4, Math.max(1, Math.round(hubPriority)));
  return 5 - p;
}
