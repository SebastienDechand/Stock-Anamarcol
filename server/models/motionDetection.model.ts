import mongoose, { Document, Model, Schema } from "mongoose";

interface ICameraPreference {
  cameraId: string;
  enabled: boolean;
}

export interface IUserMotionPreference extends Document {
  userId: string;
  userEmail: string;
  globalEnabled: boolean;
  cameras: ICameraPreference[];
}

const CameraPreferenceSchema = new Schema<ICameraPreference>(
  {
    cameraId: { type: String, required: true },
    enabled: { type: Boolean, default: false },
  },
  { _id: false },
);

const UserMotionPreferenceSchema = new Schema<IUserMotionPreference>({
  userId: { type: String, required: true, unique: true, index: true },
  userEmail: { type: String, required: true },
  globalEnabled: { type: Boolean, default: false },
  cameras: { type: [CameraPreferenceSchema], default: [] },
});

const UserMotionPreferenceModel: Model<IUserMotionPreference> =
  mongoose.model<IUserMotionPreference>(
    "userMotionPreference",
    UserMotionPreferenceSchema,
  );

export default UserMotionPreferenceModel;
