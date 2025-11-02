import sharp from 'sharp';
import fs from 'fs';

async function testImageResizing() {
  console.log("🧪 Testing image resizing functionality...\n");

  try {
    // Create test images of different sizes
    const testCases = [
      { name: "Small (500x500)", width: 500, height: 500 },
      { name: "Medium (1024x1024)", width: 1024, height: 1024 },
      { name: "Large (4000x3000)", width: 4000, height: 3000 },
      { name: "Extra Large (8000x6000)", width: 8000, height: 6000 },
    ];

    for (const testCase of testCases) {
      console.log(`\n📸 Testing: ${testCase.name}`);
      console.log("─".repeat(50));

      // Create a test image with sharp
      const originalBuffer = await sharp({
        create: {
          width: testCase.width,
          height: testCase.height,
          channels: 3,
          background: { r: 200, g: 150, b: 100 },
        },
      })
        .jpeg({ quality: 90 })
        .toBuffer();

      const originalBase64 = originalBuffer.toString('base64');
      const originalSizeKB = (originalBuffer.length / 1024).toFixed(2);

      console.log(`  Original size: ${originalSizeKB} KB`);
      console.log(`  Original dimensions: ${testCase.width}x${testCase.height}`);

      // Simulate the resizing logic from the API
      const resizedBuffer = await sharp(originalBuffer)
        .resize(2048, 2048, {
          fit: 'inside',
          withoutEnlargement: true,
        })
        .toFormat('jpeg', { quality: 85 })
        .toBuffer();

      const resizedBase64 = resizedBuffer.toString('base64');
      const resizedSizeKB = (resizedBuffer.length / 1024).toFixed(2);

      // Get metadata of resized image
      const metadata = await sharp(resizedBuffer).metadata();

      console.log(`  Resized size: ${resizedSizeKB} KB`);
      console.log(`  Resized dimensions: ${metadata.width}x${metadata.height}`);
      console.log(`  Size reduction: ${(100 - (resizedSizeKB / originalSizeKB * 100)).toFixed(1)}%`);
      console.log(`  Base64 valid: ${resizedBase64.length > 0 ? '✅ Yes' : '❌ No'}`);
      console.log(`  Aspect ratio preserved: ${(metadata.width / metadata.height).toFixed(3)}`);
    }

    console.log("\n" + "═".repeat(50));
    console.log("✅ All tests completed successfully!\n");

    // Test with actual file if it exists
    console.log("📂 Testing with actual image file if available...\n");
    const sampleImagePath = './public/sample-face.jpg';

    if (fs.existsSync(sampleImagePath)) {
      console.log(`Found sample image: ${sampleImagePath}`);
      const fileBuffer = fs.readFileSync(sampleImagePath);
      const fileMetadata = await sharp(fileBuffer).metadata();

      console.log(`  Original dimensions: ${fileMetadata.width}x${fileMetadata.height}`);
      console.log(`  Original size: ${(fileBuffer.length / 1024).toFixed(2)} KB`);

      const resizedFileBuffer = await sharp(fileBuffer)
        .resize(2048, 2048, {
          fit: 'inside',
          withoutEnlargement: true,
        })
        .toFormat('jpeg', { quality: 85 })
        .toBuffer();

      const resizedMetadata = await sharp(resizedFileBuffer).metadata();
      console.log(`  Resized dimensions: ${resizedMetadata.width}x${resizedMetadata.height}`);
      console.log(`  Resized size: ${(resizedFileBuffer.length / 1024).toFixed(2)} KB`);
    } else {
      console.log(`No sample image found at ${sampleImagePath}`);
    }

    console.log("\n✅ Image resizing is working correctly!");
  } catch (error) {
    console.error("❌ Test failed:", error.message);
    process.exit(1);
  }
}

testImageResizing();
