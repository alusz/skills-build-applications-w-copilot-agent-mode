import { CapabilityCard } from './CapabilityCard.js';
import { useApiData } from '../api/useApiData.js';

type WorkoutSuggestion = {
  _id?: string;
  title: string;
  focus?: string;
  minutes?: number;
  difficulty?: string;
  reason?: string;
};
type WorkoutResponse = { suggestions: WorkoutSuggestion[] };

export default function Workouts() {
  const path = `/api/workouts/suggestions/${encodeURIComponent('mona@example.com')}`;
  const result = useApiData<WorkoutResponse>(path, 'workout suggestions');

  return (
    <CapabilityCard title="Workout suggestions" description="Recommend workouts from activity patterns.">
      {result.status === 'loading' && <p role="status">Loading workout suggestions...</p>}
      {result.status === 'error' && <p role="alert">{result.message}</p>}
      {result.status === 'success' && (result.data.suggestions.length === 0
        ? <p>No workout suggestions yet.</p>
        : <ul className="list-group">
          {result.data.suggestions.map((suggestion, index) => (
            <li className="list-group-item" key={suggestion._id ?? index}>
              <strong>{suggestion.title}</strong>
              {suggestion.focus && <> - Focus: {suggestion.focus}</>}
              {suggestion.minutes !== undefined && <> - {suggestion.minutes} minutes</>}
              {suggestion.difficulty && <> - {suggestion.difficulty}</>}
              {suggestion.reason && <p className="mb-0">{suggestion.reason}</p>}
            </li>
          ))}
        </ul>)}
    </CapabilityCard>
  );
}
