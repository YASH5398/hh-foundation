const INTENT_KEYWORDS = {
  greeting: [
    'hi', 'hello', 'hey', 'hii', 'hlo', 'good morning', 'good evening', 'good afternoon', 'start', 'help'
  ],
  activation: [
    'id active', 'id activate', 'activate id', 'activation', 'id activation',
    'id active kaise', 'id kaise chalu kare', 'id kaise active kare',
    'account activate', 'activate account'
  ],
  userId: [
    'user id', 'userid', 'my user id',
    'mera userid', 'mera user id', 'meri id', 'meri user id',
    'id kya hai', 'my id'
  ],
  epin: [
    'epin', 'e pin', 'e-pin', 'pin', 'e_pin',
    'how many epin', 'how many e pin', 'available epin', 'available e pin',
    'epin count', 'e pin count', 'pin count',
    'epin not working', 'e pin not working', 'pin not working',
    'epin invalid', 'e pin invalid', 'pin invalid',
    'epin used', 'e pin used', 'pin used',
    'epin expired', 'e pin expired', 'pin expired',
    'no epin', 'no e pin', 'no pin',
    'epin balance', 'e pin balance', 'pin balance',
    'check epin', 'check e pin', 'check pin',
    'kitna epin', 'kitna e pin', 'kitna pin',
    'mere pas epin', 'mere paas epin', 'epin kitna',
    'epin hai', 'epin work nahi', 'e pin work nahi',
    'epin kaam nahi', 'epin chalu nahi', 'epin galat',
    'epin galt', 'epin khatam', 'epin finish',
    'epin available', 'epin show'
  ],
  sendHelp: [
    'send help', 'send payment', 'send money',
    'send help not working', 'send help blocked', 'send help disabled',
    'cannot send help', 'unable to send help', 'send help issue',
    'send help stuck', 'send help pending',
    'why send help blocked', 'why send help disabled',
    'send help activation', 'activate send help',
    'send help permission', 'send help access',
    'send help kyu nahi', 'send help kyun nahi',
    'send help nahi ho', 'send help band', 'send help disable',
    'send help block', 'send help ruk', 'send help stop',
    'send help problem', 'send help stuck', 'send help phas',
    'payment nahi kar', 'payment nahi kar pa',
    'paisa bhej', 'paisa bhejna', 'help bhej'
  ],
  receiveHelp: [
    'receive help', 'receive payment', 'receive money',
    'income', 'incoming', 'money not received',
    'not receiving', 'receiving blocked', 'receiving stopped',
    'receive help pending', 'receive help stuck',
    'when will receive', 'when receive payment',
    'receive help not coming', 'receive help delay',
    'receive help issue', 'receive help problem',
    'payment not coming', 'payment not received',
    'receive help kab', 'receive help aayega',
    'receive help kyu nahi', 'payment kyu nahi',
    'payment nahi aa', 'payment nahi aaya',
    'income nahi aa', 'paisa nahi aa',
    'receive help ruk', 'receive help band',
    'receive help block', 'incoming money'
  ],
  upcomingPayment: [
    'next payment', 'upcoming payment', 'next income', 'upcoming income',
    'when next payment', 'when will i receive',
    'next due', 'next amount', 'expected payment',
    'agla payment', 'next payout', 'future payment',
    'payment schedule', 'payment timeline',
    'agla paisa', 'agla income',
    'next payment kab', 'payment kab milega',
    'paisa kab ayega', 'income kab ayega',
    'next amount kab'
  ],
  referrals: [
    'referral', 'direct referral', 'direct joining', 'team size',
    'my referrals', 'referral count', 'team members',
    'direct team', 'referral team', 'my team',
    'referred users', 'people i referred',
    'mera referral', 'mere referral', 'referral kitna',
    'team kitni', 'joined users', 'referred people',
    'how many people joined', 'people joined through me',
    'joined through me', 'people who joined'
  ],
  leaderboard: [
    'leaderboard', 'rank', 'ranking', 'position', 'top performers',
    'my rank', 'current rank', 'leaderboard position',
    'why not in leaderboard', 'not showing in leaderboard',
    'leaderboard issue', 'rank issue',
    'mera rank', 'mujhe rank', 'rank kya hai',
    'leaderboard me kyu nahi', 'rank nahi dikha'
  ],
  profile: [
    'profile', 'bank', 'bank details', 'kyc', 'kyc details',
    'payment method', 'account', 'profile update',
    'bank account', 'bank info', 'payment info',
    'kyc pending', 'kyc verification', 'kyc status',
    'profile incomplete', 'missing profile info',
    'bank jaankari', 'payment jaankari',
    'profile adhura', 'missing info', 'jaankari nahi'
  ],
  support: [
    'ticket', 'support', 'help desk', 'complaint',
    'support ticket', 'help ticket', 'issue ticket',
    'ticket status', 'complaint status', 'support status',
    'help from support', 'contact support',
    'shikayat', 'support se madad'
  ],
  tasks: [
    'task', 'free epin', 'reward', 'completed tasks',
    'task complete', 'reward not given', 'task reward',
    'free epin task', 'daily task', 'bonus task',
    'task status', 'reward status',
    'puraskar', 'task poora', 'kaam poora',
    'reward nahi mila', 'reward dijiye'
  ]
};

const PRIORITY_ORDER = [
  'greeting',
  'activation',
  'userId',
  'epin',
  'sendHelp',
  'receiveHelp',
  'upcomingPayment',
  'referrals',
  'leaderboard',
  'profile',
  'support',
  'tasks',
  'fallback'
];

const detectIntent = (message) => {
  const msg = message.toLowerCase().trim().replace(/\s+/g, ' ').replace(/[.!?]+/g, '');
  
  console.log('IntentDetector: Processing message:', msg);
  
  for (const intent of PRIORITY_ORDER) {
    if (intent === 'fallback') continue;
    
    const keywords = INTENT_KEYWORDS[intent];
    for (const keyword of keywords) {
      if (msg.includes(keyword)) {
        console.log('IntentDetector: Matched intent:', intent, 'with keyword:', keyword);
        return intent;
      }
    }
  }
  
  console.log('IntentDetector: No intent matched, falling back to fallback');
  return 'fallback';
};

module.exports = { detectIntent };
