const { arweave, calculatePSTPayment } = require('./arweave-helpers');

test("Should get correct price for data storage", async () => {
    const price = await arweave.transactions.getPrice(1024);

    console.log(price);

    expect(parseInt(price)).toBeGreaterThan(0);
});

test("Should output a the correct percentage of a transaction cost", () => {
    const result = calculatePSTPayment(0.1);

    expect(result).toBe(0.1 * 0.2); // should be 20%
});