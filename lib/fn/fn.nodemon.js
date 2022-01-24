// Handle Nodemon Auto Restart Restart
process.once("SIGUSR2", () => {
  console.log("-".repeat(50));
});
