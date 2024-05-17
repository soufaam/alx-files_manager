import fs from 'fs';
import { ObjectId } from 'mongodb';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import dbClient from '../utils/db';
import redisClient from '../utils/redis';
import { fileQueue } from '../worker';

const FilesController = {};

FilesController.postUpload = async (req, res) => {
  const { headers } = req;
  console.log(headers);
  const token = headers['x-token'];
  const key = `auth_${token}`;
  const id = await redisClient.get(key);
  if (!id) return res.status(401).json({ error: 'Unauthorized' });
  const {
    name, type, isPublic, data,
  } = req.body;
  if (!name) return res.status(400).json({ error: 'Missing name' });
  if (!type || !['folder', 'file', 'image'].includes(type)) return res.status(400).json({ error: 'Missing type' });
  if (!data && type !== 'folder') return res.status(400).json({ error: 'Missing data' });

  let parentId = req.body.parentId || '0';
  if (parentId !== '0') {
    const parentFile = await dbClient._client.collection('files').findOne({ _id: ObjectId(parentId) });
    if (!parentFile) return res.status(400).json({ error: 'Parent not found' });
    if (parentFile.type !== 'folder') return res.status(400).json({ error: 'Parent is not a folder' });
  }
  parentId = parentId !== '0' ? ObjectId(parentId) : '0';
  const folderData = {
    id: ObjectId(id),
    name,
    type,
    isPublic: isPublic || false,
    parentId,
  };
  if (type === 'folder') {
    const newFolder = await dbClient._client.collection('files').insertOne({
      id, name, type, isPublic: isPublic || false, parentId,
    });
    folderData.parentId = parentId === '0' ? 0 : ObjectId(parentId);
    return res.status(201).json({ id: newFolder.insertedId, ...folderData });
  }

  const folderName = process.env.FOLDER_PATH || '/tmp/files_manager';
  const fileId = uuidv4();
  const localPath = path.join(folderName, fileId);

  await fs.promises.mkdir(folderName, { recursive: true });
  await fs.promises.writeFile(path.join(folderName, fileId), Buffer.from(data, 'base64'));

  const newFile = await dbClient._client.collection('files').insertOne({ localPath, ...folderData });

  if (type === 'image') {
    fileQueue.add({ fileId: newFile.insertedId, id });
  }

  folderData.parentId = parentId === '0' ? 0 : ObjectId(parentId);
  return res.status(201).json({ id: newFile.insertedId, localPath, ...folderData });
};

FilesController.getShow = async (req, res) => {
  const token = req.header('X-Token');
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  const userId = await redisClient.get(`auth_${token}`);
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });
  const fileId = req.params.id;
  const file = await dbClient._client.collection('files').findOne({ _id: ObjectId(fileId), userId: ObjectId(userId) });
  if (!file) return res.status(404).json({ error: 'Not found' });
  return res.json(file);
};

FilesController.getIndex = async (req, res) => {
  const token = req.header('X-Token');
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  const userIdString = await redisClient.get(`auth_${token}`);

  if (!userIdString) return res.status(401).json({ error: 'Unauthorized' });

  const parentId = req.query.parentId ? ObjectId(req.query.parentId) : '0';
  const userId = ObjectId(userIdString);
  const filesCount = await dbClient._client.collection('files')
    .countDocuments({ userId, parentId });

  if (filesCount === '0') return res.json([]);

  const skip = (parseInt(req.query.page, 10) || 0) * 20;
  const files = await dbClient._client.collection('files')
    .aggregate([
      { $match: { userId, parentId } },
      { $skip: skip },
      { $limit: 20 },
    ]).toArray();

  const modifyResult = files.map((file) => ({
    ...file,
    id: file._id,
    _id: undefined,
  }));

  return res.json(modifyResult);
};

export default FilesController;
