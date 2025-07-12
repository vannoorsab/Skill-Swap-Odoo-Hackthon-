import { db } from '../firebase/config';
import { collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';

export async function updateVerifiedSkills(uid: string, skills: string[]) {
  const verified: string[] = [];

  for (const skill of skills) {
    const q = query(
      collection(db, 'requests'),
      where('status', '==', 'accepted'),
      where('fromUid', '==', uid),
      where('fromSkill', '==', skill)
    );
    const q2 = query(
      collection(db, 'requests'),
      where('status', '==', 'accepted'),
      where('toUid', '==', uid),
      where('toSkill', '==', skill)
    );
    const [snap1, snap2] = await Promise.all([getDocs(q), getDocs(q2)]);
    const total = snap1.size + snap2.size;
    if (total >= 3) {
      verified.push(skill);
    }
  }

  // Store in Firestore
  await updateDoc(doc(db, 'users', uid), { verifiedSkills: verified });
  return verified;
}