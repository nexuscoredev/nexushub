import type { VercelRequest, VercelResponse } from '@vercel/node';
import handleAdegaImageProxy from './_lib/routes/adega/imageProxy.js';
import handleAdegaImageSearch from './_lib/routes/adega/imageSearch.js';
import handleAdegaSearch from './_lib/routes/adega/search.js';
import handleGoogleCalendar from './_lib/routes/google/calendar.js';
import handleHubSystemPing from './_lib/routes/hub/systemPing.js';
import handleJarvisChat from './_lib/routes/jarvis/chat.js';
import handleJarvisThreadChat from './_lib/routes/jarvis/threadChat.js';
import handleTodoistCommentById from './_lib/routes/todoist/commentById.js';
import handleTodoistComments from './_lib/routes/todoist/comments.js';
import handleTodoistLabelById from './_lib/routes/todoist/labelById.js';
import handleTodoistLabels from './_lib/routes/todoist/labels.js';
import handleTodoistProjectById from './_lib/routes/todoist/projectById.js';
import handleTodoistProjects from './_lib/routes/todoist/projects.js';
import handleTodoistSectionById from './_lib/routes/todoist/sectionById.js';
import handleTodoistSections from './_lib/routes/todoist/sections.js';
import handleTodoistTaskById from './_lib/routes/todoist/taskById.js';
import handleTodoistTasks from './_lib/routes/todoist/tasks.js';
import handleTodoistTasksFilter from './_lib/routes/todoist/tasksFilter.js';
import handleTodoistTasksQuick from './_lib/routes/todoist/tasksQuick.js';

type RouteHandler = (req: VercelRequest, res: VercelResponse) => Promise<unknown>;

function routeSegments(req: VercelRequest): string[] {
  const raw = req.query.route;
  if (!raw) return [];
  return Array.isArray(raw) ? raw : [raw];
}

function withParam(
  req: VercelRequest,
  key: string,
  value: string,
  handler: RouteHandler,
): RouteHandler {
  return async (request, response) => {
    request.query[key] = value;
    return handler(request, response);
  };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const route = routeSegments(req);
  const [root, second, third] = route;

  if (root === 'todoist') {
    if (second === 'tasks') {
      if (third === 'quick') return handleTodoistTasksQuick(req, res);
      if (third === 'filter') return handleTodoistTasksFilter(req, res);
      if (third) return withParam(req, 'taskId', third, handleTodoistTaskById)(req, res);
      return handleTodoistTasks(req, res);
    }

    if (second === 'projects') {
      if (third) return withParam(req, 'projectId', third, handleTodoistProjectById)(req, res);
      return handleTodoistProjects(req, res);
    }

    if (second === 'sections') {
      if (third) return withParam(req, 'sectionId', third, handleTodoistSectionById)(req, res);
      return handleTodoistSections(req, res);
    }

    if (second === 'labels') {
      if (third) return withParam(req, 'labelId', third, handleTodoistLabelById)(req, res);
      return handleTodoistLabels(req, res);
    }

    if (second === 'comments') {
      if (third) return withParam(req, 'commentId', third, handleTodoistCommentById)(req, res);
      return handleTodoistComments(req, res);
    }
  }

  if (root === 'adega') {
    if (second === 'search') return handleAdegaSearch(req, res);
    if (second === 'image-search') return handleAdegaImageSearch(req, res);
    if (second === 'image-proxy') return handleAdegaImageProxy(req, res);
  }

  if (root === 'jarvis') {
    if (second === 'chat') return handleJarvisChat(req, res);
    if (second === 'thread-chat') return handleJarvisThreadChat(req, res);
  }

  if (root === 'google' && second === 'calendar') {
    return handleGoogleCalendar(req, res);
  }

  if (root === 'hub' && second === 'system-ping') {
    return handleHubSystemPing(req, res);
  }

  return res.status(404).json({ error: 'Rota não encontrada' });
}
