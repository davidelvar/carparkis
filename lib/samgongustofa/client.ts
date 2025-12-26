import type { VehicleLookupResult } from '@/types';

// Rogg.is vehicle registry API
const ROGG_API_URL = 'https://rogg.is/bizServices/CarRegistry/XmlService/CarService/v0703/CarDataByNumber.aspx';
const ROGG_USER = process.env.ROGG_API_USER || 'iRent';
const ROGG_PASSWORD = process.env.ROGG_API_PASSWORD || 'Belli1010';

interface RoggVehicleData {
  make: string;
  model: string;
  year: number;
  color: string;
  fuelType: string;
  mass: number;
  vehicleTypeCode: string;
}

export async function lookupVehicle(licensePlate: string): Promise<VehicleLookupResult | null> {
  const normalized = licensePlate.replace(/[\s-]/g, '').toUpperCase();

  try {
    const url = `${ROGG_API_URL}?user=${encodeURIComponent(ROGG_USER)}&password=${encodeURIComponent(ROGG_PASSWORD)}&number=${encodeURIComponent(normalized)}`;
    
    const response = await fetch(url);

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error(`Rogg.is API error: ${response.status}`);
    }

    // Handle ISO-8859-1 encoding (common for Icelandic systems)
    const buffer = await response.arrayBuffer();
    const decoder = new TextDecoder('iso-8859-1');
    const xmlText = decoder.decode(buffer);
    
    // Parse the XML response
    const data = parseRoggXml(xmlText);
    
    if (!data) {
      return null;
    }

    // Map vehicle type based on mass
    const vehicleTypeCode = mapVehicleType(data.vehicleTypeCode, data.mass);
    const isElectric = ['Rafmagn', 'Rafbíll', 'EL', 'Tengiltvinnbíll', 'HY'].some(
      type => data.fuelType?.toLowerCase().includes(type.toLowerCase())
    );

    return {
      licensePlate: normalized,
      make: data.make,
      model: data.model,
      year: data.year,
      color: data.color,
      fuelType: data.fuelType,
      isElectric,
      vehicleTypeCode,
    };
  } catch (error) {
    console.error('Vehicle lookup failed:', error);
    throw error;
  }
}

// Parse rogg.is XML response
function parseRoggXml(xml: string): RoggVehicleData | null {
  try {
    // Extract values from XML using regex (simple parsing for common fields)
    const getValue = (tag: string): string => {
      const match = xml.match(new RegExp(`<${tag}>([^<]*)</${tag}>`, 'i'));
      return match ? match[1].trim() : '';
    };

    const make = getValue('Framleidandi') || getValue('Make') || getValue('framleidandi');
    const model = getValue('Tegund') || getValue('Model') || getValue('tegund');
    const yearStr = getValue('Arsgerð') || getValue('ModelYear') || getValue('arsgerð') || getValue('Arsgerd');
    const color = getValue('Litur') || getValue('Color') || getValue('litur');
    const fuelType = getValue('Eldsneyti') || getValue('Fuel') || getValue('eldsneyti');
    const massStr = getValue('Eiginþungi') || getValue('Mass') || getValue('eiginþungi') || getValue('Eiginthungi');
    const vehicleTypeCode = getValue('Flokkur') || getValue('VehicleType') || getValue('flokkur') || 'M1';

    if (!make && !model) {
      // No vehicle found
      return null;
    }

    return {
      make,
      model,
      year: parseInt(yearStr) || new Date().getFullYear(),
      color,
      fuelType,
      mass: parseInt(massStr) || 1500,
      vehicleTypeCode,
    };
  } catch (error) {
    console.error('Failed to parse XML:', error);
    return null;
  }
}

function mapVehicleType(typeCode: string, mass: number): string {
  // Map to our size categories: small, medium, large, xlarge
  // Based on vehicle mass (eiginþungi) in kg
  
  // N1 = Light commercial vehicle / Van - always xlarge
  if (typeCode === 'N1') {
    return 'xlarge';
  }

  // M1 = Passenger car - categorize by mass
  // Small (S): < 1300kg - compact cars like Yaris, i20, Polo
  // Medium (M): 1300-1600kg - sedans like Golf, Corolla, Model 3
  // Large (L): 1600-2000kg - SUVs like RAV4, Model Y, Tucson
  // XLarge (XL): > 2000kg - large SUVs like Land Cruiser, X5, vans
  
  if (mass < 1300) {
    return 'small';
  }
  if (mass < 1600) {
    return 'medium';
  }
  if (mass < 2000) {
    return 'large';
  }
  return 'xlarge';
}

// Mock function for development without API access
export async function lookupVehicleMock(licensePlate: string): Promise<VehicleLookupResult | null> {
  const normalized = licensePlate.replace(/[\s-]/g, '').toUpperCase();

  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));

  // Return mock data based on plate
  if (normalized.startsWith('A')) {
    return {
      licensePlate: normalized,
      make: 'Toyota',
      model: 'Yaris',
      year: 2020,
      color: 'Hvítur',
      fuelType: 'Bensín',
      isElectric: false,
      vehicleTypeCode: 'small',
    };
  }

  if (normalized.startsWith('B')) {
    return {
      licensePlate: normalized,
      make: 'Tesla',
      model: 'Model Y',
      year: 2023,
      color: 'Svartur',
      fuelType: 'Rafmagn',
      isElectric: true,
      vehicleTypeCode: 'large',
    };
  }

  if (normalized.startsWith('C')) {
    return {
      licensePlate: normalized,
      make: 'Ford',
      model: 'Transit',
      year: 2021,
      color: 'Grár',
      fuelType: 'Dísel',
      isElectric: false,
      vehicleTypeCode: 'xlarge',
    };
  }

  if (normalized.startsWith('D')) {
    return {
      licensePlate: normalized,
      make: 'Volkswagen',
      model: 'Golf',
      year: 2022,
      color: 'Blár',
      fuelType: 'Bensín',
      isElectric: false,
      vehicleTypeCode: 'medium',
    };
  }

  return null;
}
