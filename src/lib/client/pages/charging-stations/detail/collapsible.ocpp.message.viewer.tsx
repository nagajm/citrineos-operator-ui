// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { Copy, Plus } from 'lucide-react';
import { MessageTypeId, type OCPPMessageDto } from '@citrineos/base';
import { Button } from '@lib/client/components/ui/button';
import React, { useState } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { okaidia } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { buttonIconSize } from '@lib/client/styles/icon';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@lib/client/components/ui/sheet';
import { ScrollArea } from '@ferdiunal/refine-shadcn/ui';
import { copy } from '@lib/utils/copy';
import { formatDate } from '@lib/client/components/timestamp-display';

// Some vendors (e.g. a DataTransfer's `data` field) embed a JSON object as a JSON-STRING,
// since OCPP's DataTransfer payload is spec'd as a plain string — not something we or CitrineOS
// add, it's the only way a station can put structured data into a string-typed field. Recursively
// un-escapes any string value that itself parses as JSON, so the viewer can show it expanded
// instead of a single escaped blob. Never mutates what's actually stored/transmitted — this is
// purely a display transform, gated behind the "Expand nested JSON" toggle.
function expandNestedJsonStrings(value: unknown): unknown {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    const looksLikeJson =
      (trimmed.startsWith('{') && trimmed.endsWith('}')) ||
      (trimmed.startsWith('[') && trimmed.endsWith(']'));
    if (!looksLikeJson) return value;
    try {
      return expandNestedJsonStrings(JSON.parse(trimmed));
    } catch {
      return value;
    }
  }
  if (Array.isArray(value)) return value.map(expandNestedJsonStrings);
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([k, v]) => [k, expandNestedJsonStrings(v)]),
    );
  }
  return value;
}

export const CollapsibleOCPPMessageViewer: React.FC<{
  ocppMessageDto: OCPPMessageDto;
  unparsed?: boolean;
  expandNestedJson?: boolean;
}> = ({ ocppMessageDto, unparsed, expandNestedJson }) => {
  const [open, setOpen] = useState(false);
  const threshold = 7;

  const ocppMessage = ocppMessageDto.message;
  const correlationId = ocppMessageDto.correlationId;
  const timestamp = ocppMessageDto.timestamp;
  const action = ocppMessageDto.action;
  const origin = ocppMessageDto.origin;

  // Some rows have the WHOLE message double-JSON-encoded — stored as a string containing
  // '[2,"id","Action",{...}]' instead of the real array (a known backend quirk, not something
  // this component should paper over by re-stringifying). Parse it back to the real structure
  // first, then run the exact same Call/CallResult/CallError extraction every other row gets —
  // otherwise this ends up JSON.stringify-ing an already-stringified value, adding a further
  // layer of escaping on every render.
  let resolvedMessage: unknown = ocppMessage;
  if (unparsed && typeof ocppMessage === 'string') {
    try {
      resolvedMessage = JSON.parse(ocppMessage);
    } catch {
      resolvedMessage = ocppMessage; // genuinely not JSON — leave as the raw string
    }
  }

  let payload;
  if (Array.isArray(resolvedMessage)) {
    switch (resolvedMessage[0]) {
      case MessageTypeId.Call:
        payload = resolvedMessage[3];
        break;
      case MessageTypeId.CallResult:
        payload = resolvedMessage[2];
        break;
      case MessageTypeId.CallError: {
        const [
          _messageTypeId,
          _messageId,
          errorCode,
          errorDescription,
          errorDetails,
        ] = resolvedMessage;
        payload = { errorCode, errorDescription, errorDetails };
        break;
      }
      default:
        payload = resolvedMessage;
        break;
    }
  } else {
    payload = resolvedMessage;
  }

  const formattedJson = JSON.stringify(
    expandNestedJson ? expandNestedJsonStrings(payload) : payload,
    null,
    2,
  );
  const lines = formattedJson.split('\n');
  const isExpandable = lines.length > threshold;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <div className="relative">
        <SyntaxHighlighter
          language="json"
          style={okaidia}
          codeTagProps={{
            style: {
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-all',
            },
          }}
          customStyle={{
            fontSize: '0.8rem',
            padding: '0.5rem',
            borderRadius: '4px',
            maxHeight: '250px',
            margin: 0,
          }}
          wrapLongLines
        >
          {isExpandable ? lines.slice(0, threshold).join('\n') : formattedJson}
        </SyntaxHighlighter>

        <Button
          type="button"
          variant="secondary"
          size="xs"
          onClick={async (e) => {
            e.stopPropagation();
            await copy(JSON.stringify(resolvedMessage, null, 2), false);
          }}
          className={`absolute top-1 ${isExpandable ? 'right-8' : 'right-1'} p-1`}
        >
          <Copy className={buttonIconSize} />
        </Button>

        {isExpandable && (
          <SheetTrigger asChild>
            <Button
              type="button"
              size="xs"
              className="absolute top-1 right-1 p-1"
            >
              <Plus className={buttonIconSize} />
            </Button>
          </SheetTrigger>
        )}
      </div>
      <SheetContent className="min-w-1/3 pb-30" showCloseButton={false}>
        {correlationId && (
          <SheetHeader>
            <SheetTitle className="text-lg font-bold">
              <div className="flex items-center gap-1">
                {correlationId}{' '}
                <Button
                  variant="ghost"
                  size="xs"
                  onClick={async (e) => {
                    e.stopPropagation();
                    await copy(correlationId);
                  }}
                >
                  <Copy className={buttonIconSize} />
                </Button>
              </div>
            </SheetTitle>
            <SheetDescription className="text-base">
              <span className="font-semibold">
                {action} - {origin}
              </span>{' '}
              @ {formatDate(timestamp, 'yyyy-MM-dd HH:mm:ss.SSS')}
            </SheetDescription>
          </SheetHeader>
        )}
        <ScrollArea className="px-4 size-full relative">
          <SyntaxHighlighter
            language="json"
            style={okaidia}
            codeTagProps={{
              style: {
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-all',
              },
            }}
            customStyle={{
              fontSize: '0.8rem',
              padding: '0.5rem',
              borderRadius: '4px',
              maxWidth: '100%',
            }}
            wrapLongLines
          >
            {formattedJson}
          </SyntaxHighlighter>
          <Button
            variant="secondary"
            size="xs"
            onClick={async (e) => {
              e.stopPropagation();
              await copy(JSON.stringify(resolvedMessage, null, 2), false);
            }}
            className="absolute top-4 right-6 p-1"
          >
            <Copy className={buttonIconSize} />
          </Button>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
};
