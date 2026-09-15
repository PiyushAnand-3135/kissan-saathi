export interface MandiItem {
  id: string;
  name: string;
  city: string;
  district: string;
  state: string;
  gate: string;
  latitude: number;
  longitude: number;
  availableSlots: number;
  majorCrops: string[];
  contactNumber: string;
}

export const MANDIS_DATABASE: MandiItem[] = [
  // Delhi NCR / Noida / UP
  {
    id: 'noida_phase2',
    name: 'Noida Phase-2 Grain & Produce Mandi',
    city: 'Noida',
    district: 'Gautam Buddha Nagar',
    state: 'Uttar Pradesh',
    gate: 'Gate #2 (Wholesale Yard)',
    latitude: 28.5355,
    longitude: 77.391,
    availableSlots: 38,
    majorCrops: ['Wheat', 'Paddy', 'Mustard', 'Vegetables'],
    contactNumber: '0120-2460111',
  },
  {
    id: 'dadri_mandi',
    name: 'Dadri APMC Anaj Mandi',
    city: 'Dadri',
    district: 'Gautam Buddha Nagar',
    state: 'Uttar Pradesh',
    gate: 'Gate #1 (Main Weighbridge)',
    latitude: 28.552,
    longitude: 77.554,
    availableSlots: 54,
    majorCrops: ['Wheat', 'Paddy', 'Mustard', 'Bajra'],
    contactNumber: '0120-2820333',
  },
  {
    id: 'ghazipur_mandi',
    name: 'Ghazipur Integrated Mandi Yard',
    city: 'Delhi',
    district: 'East Delhi',
    state: 'Delhi',
    gate: 'Gate #4 (Grain Section)',
    latitude: 28.625,
    longitude: 77.332,
    availableSlots: 62,
    majorCrops: ['Wheat', 'Paddy', 'Maize', 'Fruits'],
    contactNumber: '011-22774400',
  },
  {
    id: 'greater_noida_kasna',
    name: 'Greater Noida Kasna Mandi Yard',
    city: 'Greater Noida',
    district: 'Gautam Buddha Nagar',
    state: 'Uttar Pradesh',
    gate: 'Gate #1',
    latitude: 28.435,
    longitude: 77.531,
    availableSlots: 29,
    majorCrops: ['Wheat', 'Mustard', 'Paddy'],
    contactNumber: '0120-2340555',
  },

  // Maharashtra / Nagpur
  {
    id: 'nagpur_kalamna',
    name: 'Nagpur APMC Main Yard (Kalamna)',
    city: 'Nagpur',
    district: 'Nagpur',
    state: 'Maharashtra',
    gate: 'Gate #3 (Grain Section)',
    latitude: 21.1718,
    longitude: 79.134,
    availableSlots: 45,
    majorCrops: ['Wheat', 'Soybean', 'Cotton', 'Paddy', 'Chana'],
    contactNumber: '0712-2680222',
  },
  {
    id: 'hingna_procurement',
    name: 'Hingna APMC Procurement Hub',
    city: 'Hingna',
    district: 'Nagpur',
    state: 'Maharashtra',
    gate: 'Gate #1',
    latitude: 21.066,
    longitude: 78.966,
    availableSlots: 28,
    majorCrops: ['Soybean', 'Cotton', 'Wheat'],
    contactNumber: '07104-242111',
  },
  {
    id: 'kalmeshwar_mandi',
    name: 'Kalmeshwar Sub-Market Yard',
    city: 'Kalmeshwar',
    district: 'Nagpur',
    state: 'Maharashtra',
    gate: 'Gate #2 (Cotton Weighbridge)',
    latitude: 21.233,
    longitude: 78.916,
    availableSlots: 60,
    majorCrops: ['Cotton', 'Soybean', 'Wheat', 'Oranges'],
    contactNumber: '07118-271333',
  },
  {
    id: 'amravati_mandi',
    name: 'Amravati APMC Cotton & Grain Yard',
    city: 'Amravati',
    district: 'Amravati',
    state: 'Maharashtra',
    gate: 'Gate #1',
    latitude: 20.937,
    longitude: 77.752,
    availableSlots: 35,
    majorCrops: ['Cotton', 'Soybean', 'Tur'],
    contactNumber: '0721-2550111',
  },

  // Punjab / Haryana
  {
    id: 'khanna_mandi',
    name: 'Khanna Asia Largest Grain Market',
    city: 'Khanna',
    district: 'Ludhiana',
    state: 'Punjab',
    gate: 'Gate #5 (Paddy Special)',
    latitude: 30.706,
    longitude: 76.221,
    availableSlots: 120,
    majorCrops: ['Wheat', 'Paddy', 'Maize'],
    contactNumber: '01628-226000',
  },
  {
    id: 'karnal_mandi',
    name: 'Karnal APMC Grain Market',
    city: 'Karnal',
    district: 'Karnal',
    state: 'Haryana',
    gate: 'Gate #2',
    latitude: 29.685,
    longitude: 76.99,
    availableSlots: 85,
    majorCrops: ['Wheat', 'Basmati Paddy', 'Mustard'],
    contactNumber: '0184-2250222',
  },
];

// Helper: Haversine distance formula in kilometers
function calculateDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

export interface NearbyMandiResult {
  id: string;
  name: string;
  distance: string;
  distanceKm: number;
  availableSlots: number;
  gate: string;
  city: string;
  state: string;
}

export function getNearbyMandisForLocation(
  userLat?: number,
  userLng?: number,
  userCity?: string,
  userState?: string
): NearbyMandiResult[] {
  // If coordinates are present, calculate accurate distance
  if (userLat && userLng) {
    const sorted = [...MANDIS_DATABASE].map((mandi) => {
      const dist = calculateDistanceKm(
        userLat,
        userLng,
        mandi.latitude,
        mandi.longitude
      );
      return {
        id: mandi.id,
        name: mandi.name,
        distance: `${dist} km away`,
        distanceKm: dist,
        availableSlots: mandi.availableSlots,
        gate: mandi.gate,
        city: mandi.city,
        state: mandi.state,
      };
    });

    sorted.sort((a, b) => a.distanceKm - b.distanceKm);

    // If the closest is reasonably nearby (< 200 km), return closest 3-4
    if (sorted[0].distanceKm < 200) {
      return sorted.slice(0, 4);
    }
  }

  // Fallback if coordinates are far or generic: filter by matching city / state or generate tailored district mandis
  const searchCity = (userCity || '').toLowerCase();
  const searchState = (userState || '').toLowerCase();

  const matched = MANDIS_DATABASE.filter(
    (m) =>
      (searchCity && m.city.toLowerCase().includes(searchCity)) ||
      (searchCity && m.district.toLowerCase().includes(searchCity)) ||
      (searchState && m.state.toLowerCase().includes(searchState))
  );

  if (matched.length > 0) {
    return matched.slice(0, 4).map((m, idx) => ({
      id: m.id,
      name: m.name,
      distance: `${(idx + 1) * 3.5} km away`,
      distanceKm: (idx + 1) * 3.5,
      availableSlots: m.availableSlots,
      gate: m.gate,
      city: m.city,
      state: m.state,
    }));
  }

  // Fallback: Return top 3 with generic distances for user's city
  const cityName = userCity || 'Local Area';
  return [
    {
      id: 'local_main',
      name: `${cityName} APMC Main Grain Yard`,
      distance: '3.2 km away',
      distanceKm: 3.2,
      availableSlots: 45,
      gate: 'Gate #1 (Main Weighbridge)',
      city: cityName,
      state: userState || 'India',
    },
    {
      id: 'local_sub',
      name: `${cityName} Sub-Market Procurement Hub`,
      distance: '7.8 km away',
      distanceKm: 7.8,
      availableSlots: 28,
      gate: 'Gate #2 (Procurement Section)',
      city: cityName,
      state: userState || 'India',
    },
    {
      id: 'local_agri',
      name: `${cityName} Central Krishi Upaj Mandi`,
      distance: '13.5 km away',
      distanceKm: 13.5,
      availableSlots: 52,
      gate: 'Gate #3 (Weighbridge)',
      city: cityName,
      state: userState || 'India',
    },
  ];
}
