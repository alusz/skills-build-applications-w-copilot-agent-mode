import { Types } from 'mongoose';
import { Activity, Team, User, Workout } from '../models/index.js';

type HttpError = Error & { status: number };

function httpError(status: number, message: string): HttpError {
  return Object.assign(new Error(message), { status });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isObjectId(value: unknown): value is string {
  return typeof value === 'string' && Types.ObjectId.isValid(value);
}

function activityFocus(type: string): string {
  const normalized = type.trim().toLowerCase();
  if (/^(run|running|walk|walking|cycle|cycling|bike|biking|swim|swimming|cardio)$/.test(normalized)) {
    return 'endurance';
  }
  if (/^(strength|weight|weights|resistance|lift|lifting)$/.test(normalized)) return 'strength';
  if (/^(yoga|stretch|stretching|mobility|flexibility)$/.test(normalized)) return 'mobility';
  return normalized;
}

export async function listActivities() {
  return Activity.find().lean();
}

export async function createActivity(input: unknown) {
  if (!isRecord(input)) throw httpError(400, 'Activity body must be an object');

  const { userId, teamId, type, minutes } = input;
  if (!isObjectId(userId) || !isObjectId(teamId)) {
    throw httpError(400, 'Valid userId and teamId are required');
  }
  if (typeof type !== 'string' || !type.trim()) {
    throw httpError(400, 'Activity type is required');
  }
  if (typeof minutes !== 'number' || !Number.isFinite(minutes) || minutes <= 0) {
    throw httpError(400, 'Activity minutes must be a positive number');
  }

  const [user, team] = await Promise.all([User.findById(userId).select('_id'), Team.findById(teamId).select('_id')]);
  if (!user) throw httpError(404, 'User not found');
  if (!team) throw httpError(404, 'Team not found');

  const activity = await Activity.create({
    user: user._id,
    team: team._id,
    type: type.trim(),
    minutes,
    points: minutes,
    occurredAt: new Date(),
  });
  return activity.toObject();
}

export async function listTeams() {
  return Team.find().lean();
}

export async function createTeam(input: unknown) {
  if (!isRecord(input)) throw httpError(400, 'Team body must be an object');

  const { name, mascot } = input;
  if (typeof name !== 'string' || !name.trim()) throw httpError(400, 'Team name is required');
  if (typeof mascot !== 'string' || !mascot.trim()) throw httpError(400, 'Team mascot is required');

  const members = input.members ?? [];
  if (!Array.isArray(members) || !members.every(isObjectId)) {
    throw httpError(400, 'Team members must be an array of valid user IDs');
  }
  const memberIds = [...new Set(members)];
  if (memberIds.length > 0) {
    const existingMembers = await User.countDocuments({ _id: { $in: memberIds } });
    if (existingMembers !== memberIds.length) throw httpError(404, 'One or more team members were not found');
  }

  const team = await Team.create({ name: name.trim(), mascot: mascot.trim(), members: memberIds });
  return team.toObject();
}

export async function getLeaderboard() {
  const teams = await Team.aggregate<{ teamName: string; totalPoints: number }>([
    {
      $lookup: {
        from: Activity.collection.name,
        localField: '_id',
        foreignField: 'team',
        as: 'activities',
      },
    },
    {
      $project: {
        _id: 0,
        teamName: '$name',
        totalPoints: { $sum: '$activities.points' },
      },
    },
    { $sort: { totalPoints: -1, teamName: 1 } },
  ]);
  return teams.map((team, index) => ({ ...team, rank: index + 1 }));
}

export async function suggestWorkouts(userEmail: string) {
  const user = await User.findOne({ email: userEmail }).lean();
  if (!user) throw httpError(404, 'User not found');

  const recentActivities = await Activity.find({ user: user._id })
    .sort({ occurredAt: -1 })
    .limit(5)
    .lean();
  const recentFocusMap = new Map<string, { count: number; activityType: string }>();
  for (const activity of recentActivities) {
    const focus = activityFocus(activity.type);
    const existing = recentFocusMap.get(focus);
    if (existing) existing.count += 1;
    else recentFocusMap.set(focus, { count: 1, activityType: activity.type });
  }
  const recentFocuses = [...recentFocusMap.entries()]
    .sort((left, right) => right[1].count - left[1].count)
    .map(([focus, pattern]) => ({ focus, activityType: pattern.activityType }));
  const goalFocus = user.fitnessGoal.trim().toLowerCase();
  const focusPriorities = [...new Set([goalFocus, ...recentFocuses.map(({ focus }) => focus)])];
  const workouts = await Workout.find().sort({ title: 1 }).lean();

  return workouts
    .map((workout) => ({
      workout,
      priority: focusPriorities.indexOf(workout.focus.trim().toLowerCase()),
    }))
    .filter(({ priority }) => priority >= 0)
    .sort((left, right) => left.priority - right.priority)
    .map(({ workout }) => {
      const focus = workout.focus.trim().toLowerCase();
      const recentPattern = recentFocuses.find((pattern) => pattern.focus === focus);
      const reason = focus === goalFocus
        ? `Recommended because it matches your ${user.fitnessGoal} goal.`
        : `Recommended based on your recent ${recentPattern?.activityType ?? 'activity'} activity.`;
      return { ...workout, reason };
    });
}

export { User };
