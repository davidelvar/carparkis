import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanup() {
  // Find services where code looks like a CUID (starts with cmj - broken services)
  const brokenServices = await prisma.service.findMany({
    where: {
      code: {
        startsWith: 'cmj'
      }
    }
  });
  
  console.log('Found broken services:', brokenServices.length);
  
  for (const svc of brokenServices) {
    console.log('Deleting:', svc.id, svc.code, svc.name);
    
    // First delete related booking addons
    await prisma.bookingAddon.deleteMany({
      where: { serviceId: svc.id }
    });
    
    // Delete related lot services
    await prisma.lotService.deleteMany({
      where: { serviceId: svc.id }
    });
    
    // Then delete the service
    await prisma.service.delete({
      where: { id: svc.id }
    });
  }
  
  console.log('Cleanup done!');
  await prisma.$disconnect();
}

cleanup().catch(console.error);
