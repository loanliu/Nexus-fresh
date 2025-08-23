import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function GET(request: NextRequest) {
  try {
    // Get git status
    const { stdout: statusOutput } = await execAsync('git status --porcelain');
    
    // Parse git status output
    const lines = statusOutput.trim().split('\n').filter(line => line.length > 0);
    
    const staged: string[] = [];
    const unstaged: string[] = [];
    const untracked: string[] = [];
    
    lines.forEach(line => {
      const status = line.substring(0, 2);
      const file = line.substring(3);
      
      if (status === 'M ' || status === 'A ' || status === 'D ' || status === 'R ') {
        // Staged changes
        staged.push(file);
      } else if (status === ' M' || status === ' A' || status === ' D' || status === ' R') {
        // Unstaged changes
        unstaged.push(file);
      } else if (status === '??') {
        // Untracked files
        untracked.push(file);
      } else if (status === 'MM' || status === 'AM' || status === 'RM') {
        // Both staged and unstaged
        staged.push(file);
        unstaged.push(file);
      }
    });
    
    return NextResponse.json({
      success: true,
      data: {
        staged,
        unstaged,
        untracked
      }
    });
    
  } catch (error) {
    console.error('Error getting git status:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to get git status',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
