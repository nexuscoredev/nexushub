/**
 * Hub UX: P1=1 (urgente) … P4=4 (baixa).
 * Todoist API: 4=urgente (p1) … 1=natural (p4).
 * @see https://developer.todoist.com/api/v1/
 */
export function todoistApiPriorityToHub(apiPriority: number): number {
  const p = Math.min(4, Math.max(1, Math.round(apiPriority)));
  return 5 - p;
}

export function hubPriorityToTodoistApi(hubPriority: number): number {
  const p = Math.min(4, Math.max(1, Math.round(hubPriority)));
  return 5 - p;
}
