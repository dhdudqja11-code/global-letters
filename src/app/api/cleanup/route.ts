import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET() {
  try {
    const setupPath = path.join(process.cwd(), 'src', 'app', 'api', 'setup-assistant', 'route.ts');
    const folderPath = path.join(process.cwd(), 'src', 'app', 'api', 'setup-assistant');

    if (fs.existsSync(setupPath)) {
      fs.unlinkSync(setupPath);
    }
    if (fs.existsSync(folderPath)) {
      fs.rmdirSync(folderPath);
    }

    return NextResponse.json({ success: true, message: "Setup files deleted successfully." });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
