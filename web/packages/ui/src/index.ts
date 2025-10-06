// Primitives
export { Button } from "./primitives/Button";

export { TextInput } from "./primitives/TextInput";

export { Select } from "./primitives/Select";

export { TextArea } from "./primitives/TextArea";

// Patterns
export { BottomSheet } from "./patterns/BottomSheet";
export type { BottomSheetProps } from "./patterns/BottomSheet";

export { Camera } from "./patterns/Camera";
export type { CameraProps, CameraMode } from "./patterns/Camera";

export { DocumentUpload } from "./patterns/DocumentUpload";
export type {
  DocumentUploadProps,
  UploadedDocument,
} from "./patterns/DocumentUpload";

export { Receipt } from "./patterns/Receipt";
export type {
  ReceiptProps,
  ReceiptField,
  ReceiptPdfOptions,
  ReceiptPdfField,
} from "./patterns/Receipt";
export { generateReceiptPdf } from "./patterns/Receipt";

// Providers
export { CarbonProviders } from "./providers/CarbonProviders";

// Layout Primitives
export { FlexGrid, Row, Column } from "@carbon/react";
