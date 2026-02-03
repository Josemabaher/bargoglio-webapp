/**
 * Cloudinary upload endpoint for Flyer images and Menu PDFs
 * POST /api/upload
 * 
 * Supports:
 * - Image uploads (flyer)
 * - PDF uploads (menu)
 */

import { NextRequest, NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File | null;
        const type = formData.get('type') as string || 'flyer'; // 'flyer' or 'menu'

        if (!file) {
            return NextResponse.json(
                { error: 'No file provided' },
                { status: 400 }
            );
        }

        // Validate file type
        const allowedImageTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
        const allowedPdfTypes = ['application/pdf'];

        const isImage = allowedImageTypes.includes(file.type);
        const isPdf = allowedPdfTypes.includes(file.type);

        if (!isImage && !isPdf) {
            return NextResponse.json(
                { error: 'Invalid file type. Allowed: JPEG, PNG, WebP, GIF, PDF' },
                { status: 400 }
            );
        }

        // Convert file to buffer
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const base64 = buffer.toString('base64');
        const dataUri = `data:${file.type};base64,${base64}`;

        // Upload to Cloudinary
        let folder = 'bargoglio/flyers';
        if (type === 'menu') folder = 'bargoglio/menus';
        if (type === 'profile') folder = 'bargoglio/profiles';

        const uploadOptions: Record<string, unknown> = {
            folder: folder,
            resource_type: isPdf ? 'raw' : 'image',
            public_id: `${type}_${Date.now()}`,
        };

        // For images, add transformations
        if (isImage) {
            uploadOptions.transformation = [
                { quality: 'auto:best' },
                { fetch_format: 'auto' }
            ];
        }

        const result = await cloudinary.uploader.upload(dataUri, uploadOptions);

        return NextResponse.json({
            success: true,
            url: result.secure_url,
            publicId: result.public_id,
            type: isPdf ? 'pdf' : 'image',
            format: result.format,
            bytes: result.bytes
        });

    } catch (error) {
        console.error('Upload error:', error);
        return NextResponse.json(
            { error: 'Upload failed', details: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
}

// Handle DELETE for removing uploaded files
export async function DELETE(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const publicId = searchParams.get('publicId');

        if (!publicId) {
            return NextResponse.json(
                { error: 'No publicId provided' },
                { status: 400 }
            );
        }

        // Determine resource type from folder
        const resourceType = publicId.includes('menus') ? 'raw' : 'image';

        const result = await cloudinary.uploader.destroy(publicId, {
            resource_type: resourceType
        });

        return NextResponse.json({
            success: result.result === 'ok',
            result: result.result
        });

    } catch (error) {
        console.error('Delete error:', error);
        return NextResponse.json(
            { error: 'Delete failed' },
            { status: 500 }
        );
    }
}
