import { CapabilityCard } from './CapabilityCard.js';
import { useApiData } from '../api/useApiData.js';

type Activity = { _id?: string; type: string; minutes: number; points: number };
type ActivitiesResponse = { activities: Activity[] };

export default function Activities() {
  const result = useApiData<ActivitiesResponse>('/api/activities', 'activities');

  return (
    <CapabilityCard title="Activities" description="Track student activity minutes and points.">
      {result.status === 'loading' && <p role="status">Loading activities...</p>}
      {result.status === 'error' && <p role="alert">{result.message}</p>}
      {result.status === 'success' && (result.data.activities.length === 0
        ? <p>No activities yet.</p>
        : <ul className="list-group">
          {result.data.activities.map((activity, index) => (
            <li className="list-group-item" key={activity._id ?? index}>
              <strong>{activity.type}</strong> - {activity.minutes} minutes - {activity.points} points
            </li>
          ))}
        </ul>)}
    </CapabilityCard>
  );
}
