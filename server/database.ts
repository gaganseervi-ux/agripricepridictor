import fs from "fs";
import path from "path";
import { Crop, MarketPrice, PredictionRecord } from "../src/types";

const DB_FILE = path.join(process.cwd(), "data.db.json");

interface DatabaseSchema {
  crops: Crop[];
  market_prices: MarketPrice[];
  predictions: PredictionRecord[];
}

export class Database {
  private data: DatabaseSchema = {
    crops: [],
    market_prices: [],
    predictions: [],
  };

  constructor() {
    this.load();
  }

  private load() {
    try {
      if (fs.existsSync(DB_FILE)) {
        const fileContent = fs.readFileSync(DB_FILE, "utf-8");
        this.data = JSON.parse(fileContent);
      } else {
        this.seed();
      }
    } catch (error) {
      console.error("Failed to load database, seeding fresh.", error);
      this.seed();
    }
  }

  private save() {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), "utf-8");
    } catch (error) {
      console.error("Failed to save database:", error);
    }
  }

  private seed() {
    console.log("Database file not found or corrupted. Seeding sample crop pricing data...");

    const initialCrops: Crop[] = [
      { id: "1", name: "Wheat", category: "Grains", description: "Standard milling quality wheat" },
      { id: "2", name: "Rice", category: "Grains", description: "Premium Basmati and long grain rice variety" },
      { id: "3", name: "Tomato", category: "Vegetables", description: "Fresh farm-sourced table tomatoes" },
      { id: "4", name: "Potato", category: "Vegetables", description: "Cold-storage stable baking potatoes" },
      { id: "5", name: "Apple", category: "Fruits", description: "Royal delicious fresh apples" },
    ];

    const initialPrices: MarketPrice[] = [];
    const markets = ["Delhi (Azadpur)", "Mumbai (Vashi)", "Bengaluru (Yeshwanthpur)"];

    // Generate price records for the last 24 months (starting Jan 2024 up to May 2026)
    // We will generate monthly data points with realistic seasonal formulas so ML can learn them
    const cropsBase = {
      Wheat: { basePrice: 2400, seasonalOffset: 0.1, volatility: 0.03, trend: 15 }, // steadily rising
      Rice: { basePrice: 3200, seasonalOffset: 0.05, volatility: 0.02, trend: 20 },
      Tomato: { basePrice: 2500, seasonalOffset: 0.8, volatility: 0.25, trend: 5 }, // extreme monsoon peak around July/August
      Potato: { basePrice: 1600, seasonalOffset: 0.15, volatility: 0.08, trend: 10 },
      Apple: { basePrice: 9000, seasonalOffset: -0.3, volatility: 0.15, trend: -50 }, // dips in Sep/Oct harvest
    };

    const startDate = new Date("2024-01-15");
    const endDate = new Date("2026-05-15");

    let priceIdCounter = 1;

    for (
      let current = new Date(startDate);
      current <= endDate;
      current.setMonth(current.getMonth() + 1)
    ) {
      const year = current.getFullYear();
      const month = current.getMonth(); // 0 to 11

      for (const [cropName, config] of Object.entries(cropsBase)) {
        for (let mIdx = 0; mIdx < markets.length; mIdx++) {
          const marketName = markets[mIdx];
          
          let seasonalMultiplier = 1;
          const monthIdx = month + 1; // 1 to 12

          if (cropName === "Tomato") {
            // Tomato peaks heavily in July (month 7) and August (month 8)
            if (monthIdx === 7 || monthIdx === 8) {
              seasonalMultiplier += config.seasonalOffset;
            } else if (monthIdx === 11 || monthIdx === 12 || monthIdx === 1 || monthIdx === 2) {
              seasonalMultiplier -= 0.3; // cheap in winter
            }
          } else if (cropName === "Apple") {
            // Apple drops price in Harvest season: September, October, November (months 9, 10, 11)
            if (monthIdx >= 9 && monthIdx <= 11) {
              seasonalMultiplier += config.seasonalOffset; // offset is negative: discount!
            } else if (monthIdx >= 2 && monthIdx <= 5) {
              seasonalMultiplier += 0.2; // expensive off-season
            }
          } else if (cropName === "Wheat") {
            // Wheat dips slightly during harvest March/April, peaks mid-winter
            if (monthIdx === 3 || monthIdx === 4) {
              seasonalMultiplier -= config.seasonalOffset;
            } else if (monthIdx === 11 || monthIdx === 12) {
              seasonalMultiplier += config.seasonalOffset;
            }
          } else {
            // Generic seasonality
            seasonalMultiplier += Math.sin((monthIdx / 12) * Math.PI * 2) * config.seasonalOffset;
          }

          // Apply steady linear trend over months
          const monthsPassed = (year - 2024) * 12 + month;
          const trendValue = monthsPassed * config.trend;

          // Introduce a deterministic market variation so they can learn different market effects
          // Delhi is base, Mumbai is +10%, Bengaluru is +5% for fruits/vegetables
          let marketMultiplier = 1.0;
          if (marketName.includes("Mumbai")) {
            marketMultiplier = 1.1;
          } else if (marketName.includes("Bengaluru")) {
            marketMultiplier = 1.05;
          }

          // Random fluctuation but deterministic enough to keep the pattern clean
          const noiseSeed = Math.sin(priceIdCounter) * config.volatility;
          const priceMultiplier = seasonalMultiplier * marketMultiplier * (1 + noiseSeed);
          
          const modalPrice = Math.round(config.basePrice * priceMultiplier + trendValue);

          // Construct formatted date string
          const dateStr = `${year}-${String(monthIdx).padStart(2, "0")}-15`;

          initialPrices.push({
            id: String(priceIdCounter++),
            date: dateStr,
            cropName,
            market: marketName,
            modalPrice,
            isSample: true,
          });
        }
      }
    }

    this.data = {
      crops: initialCrops,
      market_prices: initialPrices,
      predictions: [],
    };

    this.save();
    console.log(`Seeded database with ${initialCrops.length} crops and ${initialPrices.length} historical price rows.`);
  }

  // --- CROPS ---
  public getCrops(): Crop[] {
    return this.data.crops;
  }

  public getCropByName(name: string): Crop | undefined {
    return this.data.crops.find((c) => c.name.toLowerCase() === name.toLowerCase());
  }

  public insertCrop(crop: Omit<Crop, "id">): Crop {
    const existing = this.getCropByName(crop.name);
    if (existing) return existing;

    const newCrop: Crop = {
      id: String(this.data.crops.length + 1),
      ...crop,
    };
    this.data.crops.push(newCrop);
    this.save();
    return newCrop;
  }

  // --- MARKET PRICES ---
  public getPrices(filters?: { cropName?: string; market?: string }): MarketPrice[] {
    let result = this.data.market_prices;
    if (filters?.cropName) {
      result = result.filter((p) => p.cropName.toLowerCase() === filters.cropName!.toLowerCase());
    }
    if (filters?.market) {
      result = result.filter((p) => p.market.toLowerCase() === filters.market!.toLowerCase());
    }
    // Sort chronologically
    return result.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }

  public insertPrices(prices: Omit<MarketPrice, "id">[]): void {
    const startId = this.data.market_prices.length + 1;
    const items = prices.map((p, idx) => ({
      id: String(startId + idx),
      ...p,
    }));
    
    // Register crops dynamically if they do not exist
    const cropNamesInImports = Array.from(new Set(prices.map((p) => p.cropName)));
    cropNamesInImports.forEach((name) => {
      this.insertCrop({
        name,
        category: name.toLowerCase().includes("apple") || name.toLowerCase().includes("mango") ? "Fruits" : 
                    name.toLowerCase().includes("potato") || name.toLowerCase().includes("tomato") || name.toLowerCase().includes("onion") ? "Vegetables" : "Grains",
        description: "Imported variety",
      });
    });

    this.data.market_prices.push(...items);
    this.save();
  }

  public clearUserPrices(): void {
    // Keep only sample prices
    this.data.market_prices = this.data.market_prices.filter((p) => p.isSample);
    this.data.predictions = [];
    this.save();
  }

  // --- PREDICTIONS ---
  public getPredictions(): PredictionRecord[] {
    return this.data.predictions;
  }

  public insertPrediction(prediction: Omit<PredictionRecord, "id">): PredictionRecord {
    const newRecord: PredictionRecord = {
      id: String(this.data.predictions.length + 1),
      ...prediction,
    };
    this.data.predictions.push(newRecord);
    this.save();
    return newRecord;
  }
}

// Single active instance
export const db = new Database();
export default db;
