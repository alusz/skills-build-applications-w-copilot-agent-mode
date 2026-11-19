import { CapabilityCard } from './CapabilityCard.js';
import { useApiData } from '../api/useApiData.js';

type Team = { _id?: string; name: string; mascot?: string; members: string[] };
type TeamsResponse = { teams: Team[] };

export default function Teams() {
  const result = useApiData<TeamsResponse>('/api/teams', 'teams');

  return (
    <CapabilityCard title="Teams" description="Manage teams and members.">
      {result.status === 'loading' && <p role="status">Loading teams...</p>}
      {result.status === 'error' && <p role="alert">{result.message}</p>}
      {result.status === 'success' && (result.data.teams.length === 0
        ? <p>No teams yet.</p>
        : <ul className="list-group">
          {result.data.teams.map((team, index) => (
            <li className="list-group-item" key={team._id ?? index}>
              <strong>{team.name}</strong>
              {team.mascot && <> - Mascot: {team.mascot}</>}
              <div>Members: {team.members.length}</div>
            </li>
          ))}
        </ul>)}
    </CapabilityCard>
  );
}
