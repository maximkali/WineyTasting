import { useParams } from "wouter";

export default function RoundsDebug() {
  console.log("[DEBUG] RoundsDebug component rendering");
  const { gameId } = useParams<{ gameId: string }>();
  console.log("[DEBUG] Game ID from params:", gameId);
  
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <h1 className="text-2xl font-bold">Rounds Debug Page</h1>
      <p>Game ID: {gameId}</p>
      <p>This is a test to see if routing works</p>
    </div>
  );
}