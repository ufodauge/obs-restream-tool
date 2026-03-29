const url = new URL("https://racetime.gg/ws/race/reliable-moblin-6582");
const ws = new WebSocket(url);

ws.onopen = () => {
  console.log("WebSocket connection opened");
};

ws.onmessage = (event) => {
  console.log("Received message:", event.data);
};
