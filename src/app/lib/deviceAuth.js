import { supabase } from './supabase';

export async function enforceSingleDevice(userId) {
  // நடப்பு உலாவியின் தனித்துவமான அடையாளம் (Browser Session Identifier)
  let localSessionToken = localStorage.getItem('master_net_device_token');

  if (!localSessionToken) {
    localSessionToken = typeof crypto !== 'undefined' && crypto.randomUUID 
      ? crypto.randomUUID() 
      : Math.random().toString(36).substring(2) + Date.now().toString(36);
    localStorage.setItem('master_net_device_token', localSessionToken);
  }

  // டேட்டாபேஸில் உள்ள நடப்பு டோக்கனைச் சரிபார்த்தல்
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('current_session_token')
    .eq('id', userId)
    .single();

  if (error || !profile) return { allowed: true };

  // முதல்முறை லாகின் அல்லது டோக்கன் காலியாக இருந்தால் பதிவு செய்தல்
  if (!profile.current_session_token) {
    await supabase
      .from('profiles')
      .update({
        current_session_token: localSessionToken,
        device_info: navigator.userAgent,
        last_active: new Date().toISOString()
      })
      .eq('id', userId);
    return { allowed: true };
  }

  // டோக்கன் வேறுபட்டால்: வேறு சாதனத்தில் லாகின் செய்யப்பட்டுள்ளது
  if (profile.current_session_token !== localSessionToken) {
    return { 
      allowed: false, 
      message: "Account active on another device. Please logout from the previous device or reset session." 
    };
  }

  return { allowed: true };
}

// பழைய சாதனத்தை நீக்கி நடப்பு சாதனத்திற்கு அனுமதி மாற்றுதல்
export async function claimCurrentDevice(userId) {
  const localSessionToken = localStorage.getItem('master_net_device_token');
  await supabase
    .from('profiles')
    .update({
      current_session_token: localSessionToken,
      device_info: navigator.userAgent,
      last_active: new Date().toISOString()
    })
    .eq('id', userId);
}