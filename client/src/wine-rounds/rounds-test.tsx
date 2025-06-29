import { useParams, useLocation } from "wouter";

export default function Rounds() {
  const { gameId } = useParams<{ gameId: string }>();
  const [, navigate] = useLocation();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6 text-center">
          Rounds Page - Game ID: {gameId}
        </h1>
        <p className="text-center">This is a test rounds page.</p>
        <button 
          onClick={() => navigate(`/lobby/${gameId}`)}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded mx-auto block"
        >
          Continue to Lobby
        </button>
      </div>
    </div>
  );
}