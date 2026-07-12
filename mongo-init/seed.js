// Runs via /docker-entrypoint-initdb.d/ on a fresh volume only.
// Uses upsert + $setOnInsert so re-running is always safe (no duplicates).

const col = db.getSiblingDB("personal_1").getCollection("products");

const seeds = [
  {
    name: "Wireless Headphones",
    slug: "wireless-headphones",
    price: 79.99,
    description: "Over-ear noise-cancelling wireless headphones",
    stock: 50,
    image: "https://picsum.photos/200",
    reviews: [
      {
        createdBy: "user1",
        createdAt: new Date().toISOString(),
        rating: 5,
        comment: "Great headphones!",
      },
    ],
    isDeleted: false,
  },
  {
    name: "Mechanical Keyboard",
    slug: "mechanical-keyboard",
    price: 129.99,
    description: "TKL mechanical keyboard with brown switches",
    stock: 30,
    image: "https://picsum.photos/200",
    reviews: [
      {
        createdBy: "user2",
        createdAt: new Date().toISOString(),
        rating: 4,
        comment: "Good keyboard, but a bit loud.",
      },
      {
        createdBy: "user3",
        createdAt: new Date().toISOString(),
        rating: 5,
        comment: "I love the tactile feel!",
      },
    ],
    isDeleted: false,
  },
  {
    name: "USB-C Hub",
    slug: "usb-c-hub",
    price: 39.99,
    description: "7-in-1 USB-C hub with HDMI and PD charging",
    stock: 100,
    image: "https://picsum.photos/200",
    reviews: [
      {
        createdBy: "user4",
        createdAt: new Date().toISOString(),
        rating: 3,
        comment: "Works fine, but gets hot.",
      },
      {
        createdBy: "user5",
        createdAt: new Date().toISOString(),
        rating: 4,
        comment: "Good value for the price.",
      },
      {
        createdBy: "user6",
        createdAt: new Date().toISOString(),
        rating: 5,
        comment: "Excellent hub, very versatile!",
      },
    ],
    isDeleted: false,
  },
  {
    name: "Smartwatch",
    slug: "smartwatch",
    price: 199.99,
    description: "Fitness-focused smartwatch with heart rate monitor",
    stock: 20,
    image: "https://picsum.photos/200",
    isDeleted: false,
  },
  {
    name: "Bluetooth Speaker",
    slug: "bluetooth-speaker",
    price: 49.99,
    description: "Portable Bluetooth speaker with 12-hour battery life",
    stock: 75,
    image: "https://picsum.photos/200",
    isDeleted: true,
  }
];

for (const seed of seeds) {
  col.updateOne(
    { name: seed.name }, // match key — change to a unique business key if you have one
    { $setOnInsert: seed }, // only written when the document is newly inserted
    { upsert: true },
  );
}

print(`[seed] products collection seeded (${seeds.length} upserts attempted).`);
