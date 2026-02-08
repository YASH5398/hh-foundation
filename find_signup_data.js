const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function findData() {
    try {
        // Find an unused E-PIN
        const epinSnapshot = await db.collection('epins')
            .where('status', '==', 'unused')
            .limit(1)
            .get();

        if (epinSnapshot.empty) {
            console.log('No unused E-PIN found');
        } else {
            console.log('Unused E-PIN:', epinSnapshot.docs[0].id);
        }

        // Find a sponsor (active user)
        const sponsorSnapshot = await db.collection('users')
            .where('role', '==', 'user')
            .limit(1)
            .get();

        if (sponsorSnapshot.empty) {
            console.log('No sponsor found');
        } else {
            console.log('Sponsor ID:', sponsorSnapshot.docs[0].data().userId);
        }
    } catch (error) {
        console.error('Error:', error);
    } finally {
        process.exit();
    }
}

findData();
