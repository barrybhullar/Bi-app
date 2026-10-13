import { createClient } from '@supabase/supabase-js';

// Admin Control Script to Toggle Kill Switch, Maintenance Mode or Force Updates
// Usage: npx ts-node admin-control.ts <maintenance_on|maintenance_off|kill_switch_on|kill_switch_off|set_version <v>>

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('[ERROR] Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function main() {
  const action = process.argv[2];
  const val = process.argv[3];

  console.log(`[*] Executing Admin Action: ${action} ${val || ''}`);

  switch (action) {
    case 'maintenance_on':
      await supabase.from('app_config').update({
        is_maintenance_mode: true,
        maintenance_message: val || 'ਐਪ ਮੇਨਟੇਨੈਂਸ ਅਧੀਨ ਹੈ। ਕਿਰਪਾ ਕਰਕੇ ਕੁਝ ਸਮੇਂ ਬਾਅਦ ਦੁਬਾਰਾ ਕੋਸ਼ਿਸ਼ ਕਰੋ।'
      }).eq('id', 1);
      console.log('[SUCCESS] Maintenance Mode ENABLED for all users.');
      break;

    case 'maintenance_off':
      await supabase.from('app_config').update({ is_maintenance_mode: false }).eq('id', 1);
      console.log('[SUCCESS] Maintenance Mode DISABLED.');
      break;

    case 'kill_switch_on':
      await supabase.from('app_config').update({ kill_switch: true }).eq('id', 1);
      console.log('[SUCCESS] Kill Switch ACTIVATED. All client apps blocked.');
      break;

    case 'kill_switch_off':
      await supabase.from('app_config').update({ kill_switch: false }).eq('id', 1);
      console.log('[SUCCESS] Kill Switch DEACTIVATED.');
      break;

    case 'set_version':
      if (!val) {
        console.error('[ERROR] Provide minimum version, e.g. 1.1.0');
        process.exit(1);
      }
      await supabase.from('app_config').update({
        min_supported_version: val,
        latest_version: val
      }).eq('id', 1);
      console.log(`[SUCCESS] Minimum required version set to ${val}. Older clients will be forced to update.`);
      break;

    default:
      console.log('Valid actions: maintenance_on, maintenance_off, kill_switch_on, kill_switch_off, set_version <v>');
  }
}

main();
