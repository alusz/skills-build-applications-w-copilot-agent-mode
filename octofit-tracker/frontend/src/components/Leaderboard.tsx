import { CapabilityCard } from './CapabilityCard.js';
import { useApiData } from '../api/useApiData.js';

type LeaderboardEntry = { teamName: string; totalPoints: number; rank: number };
type LeaderboardResponse = { leaderboard: LeaderboardEntry[] };

export default function Leaderboard() {
  const result = useApiData<LeaderboardResponse>('/api/leaderboard', 'leaderboard');

  return (
    <CapabilityCard title="Leaderboard" description="Compare team point totals.">
      {result.status === 'loading' && <p role="status">Loading leaderboard...</p>}
      {result.status === 'error' && <p role="alert">{result.message}</p>}
      {result.status === 'success' && (result.data.leaderboard.length === 0
        ? <p>No leaderboard rankings yet.</p>
        : <ol className="list-group list-group-numbered">
          {result.data.leaderboard.map((entry) => (
            <li className="list-group-item" key={entry.rank}>
              <strong>{entry.teamName}</strong> - {entry.totalPoints} points
            </li>
          ))}
        </ol>)}
    </CapabilityCard>
  );
}
