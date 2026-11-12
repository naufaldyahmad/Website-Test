const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('--- Mulai Seeding Database Pelindo Berthing Schedule ---');

  // 1. Seed User Administrator & Visitor
  const adminUsername = process.env.ADMIN_USERNAME || 'admin';
  const adminPassword = process.env.ADMIN_PASSWORD || 'PelindoParepare2026!';
  const adminName = process.env.ADMIN_NAME || 'Admin Operasional Parepare';

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(adminPassword, salt);

  const admin = await prisma.user.upsert({
    where: { username: adminUsername },
    update: {
      fullName: adminName,
      passwordHash: passwordHash,
      role: 'ADMIN',
    },
    create: {
      username: adminUsername,
      fullName: adminName,
      passwordHash: passwordHash,
      role: 'ADMIN',
    },
  });
  console.log(`[USER] Admin user siap: ${admin.username} (${admin.fullName})`);

  // Visitor User
  const visitorHash = await bcrypt.hash('visitor123', salt);
  const visitor = await prisma.user.upsert({
    where: { username: 'visitor' },
    update: {
      fullName: 'Tamu Operasional / Visitor',
      passwordHash: visitorHash,
      role: 'VISITOR',
    },
    create: {
      username: 'visitor',
      fullName: 'Tamu Operasional / Visitor',
      passwordHash: visitorHash,
      role: 'VISITOR',
    },
  });
  console.log(`[USER] Visitor user siap: ${visitor.username}`);

  // Default System Setting: firstDayOfWeek = 1 (Senin / Monday)
  await prisma.systemSetting.upsert({
    where: { key: 'firstDayOfWeek' },
    update: {},
    create: {
      key: 'firstDayOfWeek',
      value: '1', // 0 = Minggu, 1 = Senin, 2 = Selasa, 3 = Rabu, 4 = Kamis, 5 = Jumat, 6 = Sabtu
    },
  });
  console.log('[SETTING] Pengaturan firstDayOfWeek default: 1 (Senin)');

  // 2. Seed Master Dermaga
  const defaultBerth = await prisma.berth.upsert({
    where: { code: 'DERMAGA-PAREPARE-01' },
    update: {
      name: 'Dermaga Pelabuhan Nusantara Parepare',
      lengthMeters: 366.0,
      description: 'Dermaga umum Pelabuhan Nusantara Parepare dengan rentang 0 - 366 meter (Ujung Selatan 0m s.d Ujung Utara 366m).',
      isActive: true,
    },
    create: {
      code: 'DERMAGA-PAREPARE-01',
      name: 'Dermaga Pelabuhan Nusantara Parepare',
      lengthMeters: 366.0,
      description: 'Dermaga umum Pelabuhan Nusantara Parepare dengan rentang 0 - 366 meter (Ujung Selatan 0m s.d Ujung Utara 366m).',
      isActive: true,
    },
  });
  console.log(`[BERTH] Dermaga siap: ${defaultBerth.name} (${defaultBerth.lengthMeters} m)`);

  // 3. Seed Master Kapal
  const sampleVessels = [
    {
      code: 'KAP-001',
      name: 'KM. LAMBELU',
      vesselType: 'Penumpang',
      loa: 146.5,
      beam: 23.4,
      draft: 5.9,
      grossTonnage: 14649,
      agentName: 'PT. PELNI (Persero)',
      remarks: 'Kapal penumpang rute Parepare - Balikpapan - Tarakan - Nunukan',
      imageUrl: '/images/vessels/km-lambelu.svg',
    },
    {
      code: 'KAP-002',
      name: 'KM. BUKIT SIGUNTANG',
      vesselType: 'Penumpang',
      loa: 146.5,
      beam: 23.4,
      draft: 5.9,
      grossTonnage: 14649,
      agentName: 'PT. PELNI (Persero)',
      remarks: 'Kapal penumpang rute Makassar - Parepare - Balikpapan - Tarakan',
      imageUrl: '/images/vessels/km-bukit-siguntang.svg',
    },
    {
      code: 'KAP-003',
      name: 'KM. PANTOKRATOR',
      vesselType: 'Roro / Penumpang',
      loa: 110.0,
      beam: 18.0,
      draft: 4.8,
      grossTonnage: 5800,
      agentName: 'PT. Panca Merak Samudera',
      remarks: 'Kapal Roro reguler lintas Parepare - Samarinda',
      imageUrl: '/images/vessels/km-pantokrator.svg',
    },
    {
      code: 'KAP-004',
      name: 'KM. PRINCE SOYA',
      vesselType: 'Roro / Penumpang',
      loa: 120.0,
      beam: 19.5,
      draft: 5.0,
      grossTonnage: 6500,
      agentName: 'PT. Bunga Teratai',
      remarks: 'Kapal penumpang & kendaraan lintas Parepare - Samarinda',
      imageUrl: '/images/vessels/km-prince-soya.svg',
    },
    {
      code: 'KAP-005',
      name: 'KM. MADANI NUSANTARA',
      vesselType: 'Roro / Penumpang',
      loa: 98.0,
      beam: 16.5,
      draft: 4.5,
      grossTonnage: 4300,
      agentName: 'PT. Jembatan Nusantara',
      remarks: 'Kapal reguler lintas Parepare - Balikpapan',
      imageUrl: '/images/vessels/km-madani-nusantara.svg',
    },
    {
      code: 'KAP-006',
      name: 'KM. DHARMA FERRY III',
      vesselType: 'Roro / Penumpang',
      loa: 90.0,
      beam: 15.0,
      draft: 4.2,
      grossTonnage: 3800,
      agentName: 'PT. Dharma Lautan Utama',
      remarks: 'Kapal Roro Parepare - Batulicin',
      imageUrl: '/images/vessels/km-dharma-ferry-3.svg',
    },
    {
      code: 'KAP-007',
      name: 'KM. MERATUS KENDARI',
      vesselType: 'Petikemas',
      loa: 125.0,
      beam: 20.0,
      draft: 6.2,
      grossTonnage: 7200,
      agentName: 'PT. Meratus Line',
      remarks: 'Kapal petikemas feeder Surabaya - Parepare',
      imageUrl: '/images/vessels/km-meratus.svg',
    },
    {
      code: 'KAP-008',
      name: 'TB. MARINA 18 / BG. MARINA 3001',
      vesselType: 'Kargo Curah',
      loa: 95.0,
      beam: 24.0,
      draft: 4.0,
      grossTonnage: 3200,
      agentName: 'PT. Marina Maritim',
      remarks: 'Tongkang batu bara & material industri',
      imageUrl: '/images/vessels/tb-marina.svg',
    },
  ];

  const createdVessels = {};
  for (const v of sampleVessels) {
    const vessel = await prisma.vessel.upsert({
      where: { code: v.code },
      update: v,
      create: v,
    });
    createdVessels[v.code] = vessel;
  }
  console.log(`[VESSEL] Berhasil membuat/memperbarui ${Object.keys(createdVessels).length} master kapal.`);

  // 4. Seed Jadwal Mingguan Aktif (Minggu ini)
  // Menghitung hari Senin terdekat (Senin jam 00:00 WITA)
  const now = new Date();
  const currentDay = now.getDay(); // 0 is Sunday, 1 is Monday
  const diffToMonday = currentDay === 0 ? -6 : 1 - currentDay;

  const monday = new Date(now);
  monday.setDate(now.getDate() + diffToMonday);
  monday.setHours(0, 0, 0, 0);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);

  // Hitung nomor minggu ISO
  const d = new Date(Date.UTC(monday.getFullYear(), monday.getMonth(), monday.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  const year = d.getUTCFullYear();

  const weeklySchedule = await prisma.weeklySchedule.upsert({
    where: {
      year_weekNumber: {
        year: year,
        weekNumber: weekNo,
      },
    },
    update: {
      startDate: monday,
      endDate: sunday,
      status: 'AKTIF',
      notes: `Jadwal Operasional Mingguan Periode Minggu ke-${weekNo} Tahun ${year}`,
    },
    create: {
      year: year,
      weekNumber: weekNo,
      startDate: monday,
      endDate: sunday,
      status: 'AKTIF',
      notes: `Jadwal Operasional Mingguan Periode Minggu ke-${weekNo} Tahun ${year}`,
    },
  });
  console.log(`[SCHEDULE] Jadwal mingguan aktif dibuat: Minggu ke-${weekNo} Tahun ${year}`);

  // Hapus entri lama untuk seeding ulang yang bersih
  await prisma.scheduleEntry.deleteMany({
    where: { weeklyScheduleId: weeklySchedule.id },
  });

  // Helper untuk membuat datetime pada hari tertentu (0 = Senin, dst.)
  const createDateTime = (dayOffset, hours, minutes) => {
    const dt = new Date(monday);
    dt.setDate(monday.getDate() + dayOffset);
    dt.setHours(hours, minutes, 0, 0);
    return dt;
  };

  // Seed sample schedule entries:
  // 1. KM Lambelu: Senin 06:00 s.d Senin 18:00 (meter 0 - 146.5, Bow North)
  // 2. KM Pantokrator: Senin 12:00 s.d Selasa 08:00 (meter 160 - 270, Bow North)
  // 3. KM Prince Soya: Selasa 10:00 s.d Rabu 04:00 (meter 50 - 170, Bow South)
  // 4. KM Bukit Siguntang: Rabu 02:00 s.d Rabu 16:00 (meter 180 - 326.5, Bow North)
  // 5. KM Madani Nusantara: Kamis 08:00 s.d Kamis 22:00 (meter 20 - 118, Bow North)
  // 6. KM Dharma Ferry III: Jumat 07:00 s.d Sabtu 02:00 (meter 130 - 220, Bow North, Overhang 15m)
  // 7. KM Meratus Kendari: Sabtu 06:00 s.d Minggu 14:00 (meter 220 - 345, Bow South)

  const entriesToCreate = [
    {
      weeklyScheduleId: weeklySchedule.id,
      vesselId: createdVessels['KAP-001'].id,
      berthId: defaultBerth.id,
      eta: createDateTime(0, 6, 0), // Senin 06:00
      etd: createDateTime(0, 18, 0), // Senin 18:00
      startMeter: 10.0,
      endMeter: 156.5,
      bowPositionMeter: 156.5,
      sternPositionMeter: 10.0,
      orientation: 'BOW_NORTH_STERN_SOUTH',
      dockedLength: 146.5,
      overhangLength: 0.0,
      overhangPosition: 'NONE',
      notes: 'Bongkar muat penumpang & logistik rute Balikpapan',
    },
    {
      weeklyScheduleId: weeklySchedule.id,
      vesselId: createdVessels['KAP-003'].id,
      berthId: defaultBerth.id,
      eta: createDateTime(0, 12, 0), // Senin 12:00
      etd: createDateTime(1, 8, 0), // Selasa 08:00
      startMeter: 170.0,
      endMeter: 280.0,
      bowPositionMeter: 280.0,
      sternPositionMeter: 170.0,
      orientation: 'BOW_NORTH_STERN_SOUTH',
      dockedLength: 110.0,
      overhangLength: 0.0,
      overhangPosition: 'NONE',
      notes: 'Pemuatan kendaraan truk & sembako rute Samarinda',
    },
    {
      weeklyScheduleId: weeklySchedule.id,
      vesselId: createdVessels['KAP-004'].id,
      berthId: defaultBerth.id,
      eta: createDateTime(1, 10, 0), // Selasa 10:00
      etd: createDateTime(2, 4, 0), // Rabu 04:00
      startMeter: 40.0,
      endMeter: 160.0,
      bowPositionMeter: 40.0,
      sternPositionMeter: 160.0,
      orientation: 'BOW_SOUTH_STERN_NORTH',
      dockedLength: 120.0,
      overhangLength: 0.0,
      overhangPosition: 'NONE',
      notes: 'Sandar buritan utara haluan selatan',
    },
    {
      weeklyScheduleId: weeklySchedule.id,
      vesselId: createdVessels['KAP-002'].id,
      berthId: defaultBerth.id,
      eta: createDateTime(2, 2, 0), // Rabu 02:00
      etd: createDateTime(2, 16, 0), // Rabu 16:00
      startMeter: 180.0,
      endMeter: 326.5,
      bowPositionMeter: 326.5,
      sternPositionMeter: 180.0,
      orientation: 'BOW_NORTH_STERN_SOUTH',
      dockedLength: 146.5,
      overhangLength: 0.0,
      overhangPosition: 'NONE',
      notes: 'Reguler PELNI rute Nunukan',
    },
    {
      weeklyScheduleId: weeklySchedule.id,
      vesselId: createdVessels['KAP-005'].id,
      berthId: defaultBerth.id,
      eta: createDateTime(3, 8, 0), // Kamis 08:00
      etd: createDateTime(3, 22, 0), // Kamis 22:00
      startMeter: 30.0,
      endMeter: 128.0,
      bowPositionMeter: 128.0,
      sternPositionMeter: 30.0,
      orientation: 'BOW_NORTH_STERN_SOUTH',
      dockedLength: 98.0,
      overhangLength: 0.0,
      overhangPosition: 'NONE',
      notes: 'Bongkar muatan kendaraan dari Balikpapan',
    },
    {
      weeklyScheduleId: weeklySchedule.id,
      vesselId: createdVessels['KAP-006'].id,
      berthId: defaultBerth.id,
      eta: createDateTime(4, 7, 0), // Jumat 07:00
      etd: createDateTime(5, 2, 0), // Sabtu 02:00
      startMeter: 290.0,
      endMeter: 366.0,
      bowPositionMeter: 366.0,
      sternPositionMeter: 290.0,
      orientation: 'BOW_NORTH_STERN_SOUTH',
      dockedLength: 76.0,
      overhangLength: 14.0, // Menggantung di ujung utara dermaga melampaui meter 366
      overhangPosition: 'BOW',
      notes: 'Kapal sandar dengan haluan menggantung (overhang 14m) melampaui batas dermaga utara',
    },
    {
      weeklyScheduleId: weeklySchedule.id,
      vesselId: createdVessels['KAP-007'].id,
      berthId: defaultBerth.id,
      eta: createDateTime(5, 6, 0), // Sabtu 06:00
      etd: createDateTime(6, 14, 0), // Minggu 14:00
      startMeter: 100.0,
      endMeter: 225.0,
      bowPositionMeter: 100.0,
      sternPositionMeter: 225.0,
      orientation: 'BOW_SOUTH_STERN_NORTH',
      dockedLength: 125.0,
      overhangLength: 0.0,
      overhangPosition: 'NONE',
      notes: 'Bongkar muat kontainer dengan crane pelabuhan',
    },
  ];

  for (const item of entriesToCreate) {
    await prisma.scheduleEntry.create({ data: item });
  }

  // Audit log
  await prisma.auditLog.create({
    data: {
      userId: admin.id,
      action: 'SEED',
      entityType: 'SCHEDULE',
      entityId: weeklySchedule.id,
      details: JSON.stringify({ message: 'Initial seeding data for weekly schedule' }),
    },
  });

  console.log(`[SCHEDULE] Berhasil menginput ${entriesToCreate.length} entri jadwal sandar kapal.`);
  console.log('--- Selesai Seeding Database Pelindo Berthing Schedule ---');
}

main()
  .catch((e) => {
    console.error('Error saat seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

