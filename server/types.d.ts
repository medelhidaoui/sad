declare module 'qrcode' {
  interface QRCodeToStringOptions {
    type?: 'svg' | 'utf8' | 'terminal';
    errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
    margin?: number;
    width?: number;
    scale?: number;
    small?: boolean;
    color?: {
      dark?: string;
      light?: string;
    };
  }

  export function toString(
    text: string,
    options?: QRCodeToStringOptions
  ): Promise<string>;

  export function toDataURL(
    text: string,
    options?: any
  ): Promise<string>;

  export function toCanvas(
    canvas: any,
    text: string,
    options?: any
  ): Promise<any>;

  export function toBuffer(
    text: string,
    options?: any
  ): Promise<Buffer>;

  export function create(
    text: string,
    options?: any
  ): any;
}