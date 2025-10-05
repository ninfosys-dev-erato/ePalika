export const simulation = {
  latency: 200,
  errorRate: 0.03,
};

export async function simulate<T>(fn: () => T): Promise<T> {
  await new Promise((r) => setTimeout(r, simulation.latency));
  if (Math.random() < simulation.errorRate) {
    throw new Error("Simulated Network Error");
  }
  return fn();
}
