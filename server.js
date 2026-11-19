import app from "./src/app.js";
import connectDB from "./src/config/mongoDB.js";

const PORT = process.env.PORT || 5000;

connectDB();

app.get("/", (req, res) => {
  res.json({ message: "api is reachable" });
});

app.listen(PORT, () => {
  console.log(`app is running at port ${PORT}`);
});
