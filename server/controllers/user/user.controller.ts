import { Request, Response } from "express";
import UserModel, { IUser } from "../../models/user.model";
import { validateObjectId } from "../../utils/validate/validate.utils";
import { logEvent } from "../../utils/audit/audit.utils";
import { handleError } from "../../utils/response/response.utils";
import { Role, ROLES } from "../../constants";
import { ErrorCode } from "../../constants/errorCodes";

// Map a single role to canonical roles array
const ROLE_TO_ROLES: Record<Role, Role[]> = {
  [Role.SUPERADMIN]: [Role.SUPERADMIN, Role.ADMIN, Role.USER],
  [Role.ADMIN]: [Role.ADMIN, Role.USER],
  [Role.MONTEUR]: [Role.USER, Role.MONTEUR],
  [Role.HOTLINE]: [Role.USER, Role.HOTLINE],
  [Role.USER]: [Role.USER],
};

// Set roles via single role value (backward-compat endpoint)
export const setRole = async (req: Request, res: Response): Promise<void> => {
  if (!validateObjectId(req.params.id as string, res)) return;

  const { role } = req.body as { role?: string };
  if (!role || !ROLES.includes(role as Role)) {
    res
      .status(400)
      .json({ message: "Invalid role", code: ErrorCode.INVALID_ROLE });
    return;
  }

  try {
    const user = await UserModel.findById(req.params.id);
    if (!user) {
      res
        .status(404)
        .json({ message: "User not found", code: ErrorCode.USER_NOT_FOUND });
      return;
    }
    user.roles = ROLE_TO_ROLES[role as Role] ?? [Role.USER];
    const updated = await user.save();
    await logEvent(
      "update",
      "user",
      updated._id.toString(),
      res.locals.user?.username,
      { roles: user.roles },
    );
    res.status(200).json({
      message: "Roles updated",
      code: ErrorCode.ROLES_UPDATED,
      user: updated._id,
      roles: user.roles,
    });
  } catch (err) {
    handleError(res, err, "Error setting role:");
  }
};

// Set multiple roles for a user (admin only)
export const setRoles = async (req: Request, res: Response): Promise<void> => {
  if (!validateObjectId(req.params.id as string, res)) return;

  const { roles } = req.body as { roles?: unknown };
  if (!Array.isArray(roles) || !roles.every((r) => ROLES.includes(r as Role))) {
    res
      .status(400)
      .json({ message: "Invalid roles", code: ErrorCode.INVALID_ROLE });
    return;
  }

  try {
    const user = await UserModel.findById(req.params.id);
    if (!user) {
      res
        .status(404)
        .json({ message: "User not found", code: ErrorCode.USER_NOT_FOUND });
      return;
    }
    user.roles = roles as Role[];
    const updated = await user.save();
    await logEvent(
      "update",
      "user",
      updated._id.toString(),
      res.locals.user?.username,
      { roles },
    );
    res
      .status(200)
      .json({ message: "Roles updated", code: ErrorCode.ROLES_UPDATED, roles });
  } catch (err) {
    handleError(res, err, "Error setting roles:");
  }
};

// Returns all registered users
export const getAllUsers = async (
  _req: Request,
  res: Response,
): Promise<void> => {
  const users = await UserModel.find().select("-password");
  res.status(200).json(users);
};

// Returns a user's info by ID
export const userInfo = async (req: Request, res: Response): Promise<void> => {
  if (!validateObjectId(req.params.id as string, res)) return;

  try {
    const user = await UserModel.findById(req.params.id)
      .select("-password")
      .lean();
    if (!user) {
      res
        .status(404)
        .json({ message: "User not found", code: ErrorCode.USER_NOT_FOUND });
      return;
    }
    res.status(200).json(user);
  } catch (err) {
    handleError(res, err, "Error fetching user:");
  }
};

// Update a user
export const updateUser = async (
  req: Request,
  res: Response,
): Promise<void> => {
  if (!validateObjectId(req.params.id as string, res)) return;

  const requester = res.locals.user;
  const isSelf = requester?._id?.toString() === req.params.id;
  const isAdmin =
    !!requester?.roles?.includes(Role.ADMIN) ||
    !!requester?.roles?.includes(Role.SUPERADMIN);

  // Admins can update anyone; everyone else can only update their own record
  // (and even then, only the self-service fields below - see isAdmin gates).
  if (!isSelf && !isAdmin) {
    res.status(403).json({
      message: "Access denied - admin required",
      code: ErrorCode.ACCESS_DENIED_ADMIN,
    });
    return;
  }

  try {
    const user = await UserModel.findById(req.params.id);

    if (!user) {
      res
        .status(404)
        .json({ message: "User not found", code: ErrorCode.USER_NOT_FOUND });
      return;
    }

    const old =
      typeof user.toObject === "function" ? user.toObject() : { ...user };

    // Self-service fields - allowed for the account owner and admins alike.
    if (req.body.phone) user.phone = req.body.phone;
    if (req.body.picture) user.picture = req.body.picture;

    // Admin-only fields - a non-admin editing their own record cannot touch
    // these (email/password/position/department all affect access or role assignment).
    if (isAdmin) {
      if (req.body.email) user.email = req.body.email;
      if (req.body.password) user.password = req.body.password;
      if (req.body.position) user.position = req.body.position;
      if (req.body.department !== undefined) {
        user.department = req.body.department;
        // Auto-assign/downgrade hotline role based on department (do not override admins)
        if (String(req.body.department) === "Hotline") {
          if (
            !user.roles.includes(Role.ADMIN) &&
            !user.roles.includes(Role.SUPERADMIN) &&
            !user.roles.includes(Role.HOTLINE)
          ) {
            user.roles = [...user.roles, Role.HOTLINE];
          }
        } else {
          if (user.roles.includes(Role.HOTLINE)) {
            user.roles = user.roles.filter((r) => r !== Role.HOTLINE);
            if (user.roles.length === 0) user.roles = [Role.USER];
          }
        }
      }
    }

    const updatedUser = await user.save();
    try {
      const changes: Record<string, { old?: unknown; new?: unknown }> = {};
      const fields: Array<keyof IUser> = [
        "email",
        "position",
        "phone",
        "department",
        "picture",
        "roles",
      ];
      const oldObj = old as Partial<Record<keyof IUser, unknown>>;
      const newObj = updatedUser as Partial<Record<keyof IUser, unknown>>;
      for (const key of fields) {
        const oldVal = oldObj[key];
        const newVal = newObj[key];
        if (String(oldVal ?? "") !== String(newVal ?? "")) {
          changes[key as string] = { old: oldVal, new: newVal };
        }
      }
      if (Object.keys(changes).length > 0) {
        await logEvent(
          "update",
          "user",
          updatedUser._id.toString(),
          res.locals.user?.username,
          { changes },
        );
      }
    } catch (err) {
      console.error("Audit user update error:", err);
    }

    res.send(updatedUser);
  } catch (err) {
    handleError(res, err, "Error updating user:");
  }
};

// Delete a user
export const deleteUser = async (
  req: Request,
  res: Response,
): Promise<void> => {
  if (!validateObjectId(req.params.id as string, res)) return;

  try {
    // findById may be mocked and not return a query with `.lean()` in tests
    const maybeQuery = UserModel.findById(req.params.id as string);
    let toDelete: unknown = undefined;
    if (maybeQuery) {
      if (typeof maybeQuery.lean === "function") {
        toDelete = await maybeQuery.lean();
      } else if (
        typeof (maybeQuery as { then?: unknown }).then === "function"
      ) {
        // It's a thenable (promise)
        toDelete = await maybeQuery;
      } else {
        toDelete = undefined;
      }
    }
    await UserModel.deleteOne({ _id: req.params.id }).exec();
    try {
      await logEvent(
        "delete",
        "user",
        String(req.params.id),
        res.locals.user?.username,
        { deleted: toDelete },
      );
    } catch (err) {
      console.error("logEvent delete user error:", err);
    }
    res
      .status(200)
      .json({ message: "Successfully deleted", code: ErrorCode.DELETED });
  } catch (err) {
    handleError(res, err, "Error deleting user:");
  }
};
