import { GamePage } from "@ui/pages/GamePage";
// To use the read-only dev page from Sprint 4, uncomment the next line and replace <GamePage /> with <DevPage />
// import { DevPage } from "@ui/pages/DevPage";

function App() {
  return (
    <div className="app">
      <h1>CYCLES</h1>
      <GamePage />
    </div>
  );
}

export default App;
