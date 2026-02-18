
"use server";

import { db } from '@/lib/firebase';
import { getDocs, collection, collectionGroup } from '@/lib/firebase';

const COLLECTIONS_TO_BACKUP = [
    'users', 'roles', 'settings', 'employees', 'chiefs', 'missions',
    'leaves', 'assets', 'fleet', 'conflicts', 'supplies', 'evaluations',
    'budgetLines', 'departments', 'directions', 'services', 'counters',
    'notifications', 'repository'
    // Subcollections like 'history' will be handled via collectionGroup
];

/**
 * Escapes a string for use in an SQL literal.
 * @param str The string to escape.
 * @returns The escaped string, or 'NULL' if the input is null/undefined.
 */
const escapeSql = (value: any): string => {
    if (value === null || value === undefined) return 'NULL';
    if (typeof value === 'boolean') return value ? 'TRUE' : 'FALSE';
    if (typeof value === 'number') return String(value);

    // For strings, escape single quotes
    const str = String(value);
    return `'${str.replace(/'/g, "''")}'`;
};

/**
 * Converts a Firestore document's data into an SQL INSERT statement.
 * @param collectionName The name of the table.
 * @param docId The ID of the document.
 * @param data The document's data.
 * @returns A formatted SQL INSERT statement string.
 */
const toSqlInsert = (collectionName: string, docId: string, data: Record<string, any>): string => {
    const dataWithId: Record<string, any> = { id: docId, ...data };

    // Convert arrays and objects to JSON strings
    for (const key in dataWithId) {
        if (Array.isArray(dataWithId[key]) || (typeof dataWithId[key] === 'object' && dataWithId[key] !== null)) {
            dataWithId[key] = JSON.stringify(dataWithId[key]);
        }
    }

    const columns = Object.keys(dataWithId).map(col => `\`${col}\``).join(', ');
    const values = Object.values(dataWithId).map(escapeSql).join(', ');

    return `INSERT INTO \`${collectionName}\` (${columns}) VALUES (${values});`;
};

/**
 * Generates a complete SQL backup of the specified Firestore collections.
 * @returns A string containing the full SQL backup.
 */
export async function generateSqlBackup(): Promise<string> {
    let sqlString = '-- Firestore Database Backup\n';
    sqlString += `-- Generated on: ${new Date().toISOString()}\n\n`;

    // Backup top-level collections
    for (const collectionName of COLLECTIONS_TO_BACKUP) {
        try {
            sqlString += `--\n-- Data for collection: ${collectionName}\n--\n`;
            const snapshot = await getDocs(collection(db, collectionName));
            if (snapshot.empty) {
                sqlString += `-- No documents found in ${collectionName}.\n\n`;
                continue;
            }
            snapshot.forEach(doc => {
                sqlString += toSqlInsert(collectionName, doc.id, doc.data()) + '\n';
            });
            sqlString += '\n';
        } catch (error) {
            console.error(`Error backing up collection ${collectionName}:`, error);
            sqlString += `-- ERROR backing up collection ${collectionName}: ${error instanceof Error ? error.message : String(error)}\n\n`;
        }
    }

    // Backup subcollections using collectionGroup
    const subcollections = ['history'];
    for (const subcollectionName of subcollections) {
        try {
            sqlString += `--\n-- Data for subcollection group: ${subcollectionName}\n--\n`;
            const snapshot = await getDocs(collectionGroup(db, subcollectionName));
            if (snapshot.empty) {
                sqlString += `-- No documents found in subcollection group ${subcollectionName}.\n\n`;
                continue;
            }
            snapshot.forEach(doc => {
                // Path is like 'employees/employeeId123/history/eventId456'
                const pathParts = doc.ref.path.split('/');
                const parentCollection = pathParts[0];
                const parentId = pathParts[1];
                const subcollection = pathParts[2];

                const dataWithParent = {
                    ...doc.data(),
                    parentId: parentId, // Add parent ID for context
                    parentCollection: parentCollection
                };

                sqlString += toSqlInsert(subcollection, doc.id, dataWithParent) + '\n';
            });
            sqlString += '\n';
        } catch (error) {
            console.error(`Error backing up subcollection group ${subcollectionName}:`, error);
            sqlString += `-- ERROR backing up subcollection group ${subcollectionName}: ${error instanceof Error ? error.message : String(error)}\n\n`;
        }
    }

    return sqlString;
}
