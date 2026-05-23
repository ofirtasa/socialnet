import type { Express } from "express";
import { getTotalStats, searchGroups, searchPosts, searchUsers } from "../db";

function optionalDate(value: unknown) {
  if (typeof value !== "string" || !value.trim()) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

function optionalString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

export function registerJqueryAjaxRoutes(app: Express) {
  app.get("/api/jquery/summary", async (_req, res, next) => {
    try {
      const totals = await getTotalStats();
      res.json({ success: true, totals });
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/jquery/search/posts", async (req, res, next) => {
    try {
      const posts = await searchPosts({
        keyword: optionalString(req.query.keyword),
        groupId: optionalString(req.query.groupId),
        authorId: optionalString(req.query.authorId),
        postType: optionalString(req.query.postType),
        dateFrom: optionalDate(req.query.dateFrom),
        dateTo: optionalDate(req.query.dateTo),
      });
      res.json({ success: true, results: posts });
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/jquery/search/users", async (req, res, next) => {
    try {
      const users = await searchUsers({
        name: optionalString(req.query.name),
        role: optionalString(req.query.role),
        joinedAfter: optionalDate(req.query.joinedAfter),
        joinedBefore: optionalDate(req.query.joinedBefore),
      });
      res.json({ success: true, results: users });
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/jquery/search/groups", async (req, res, next) => {
    try {
      const rawPrivate = optionalString(req.query.isPrivate);
      const groups = await searchGroups({
        name: optionalString(req.query.name),
        managerId: optionalString(req.query.managerId),
        isPrivate: rawPrivate === undefined ? undefined : rawPrivate === "true",
      });
      res.json({ success: true, results: groups });
    } catch (error) {
      next(error);
    }
  });
}
