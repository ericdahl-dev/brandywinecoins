/* Payload's own root layout. Generated shape, kept as Payload expects it so an
   upgrade can be diffed against the template rather than reverse-engineered.
   The site's layout lives in app/(frontend) and the two never meet. */
import type { ServerFunctionClient } from 'payload';

import config from '@payload-config';
import { handleServerFunctions, RootLayout } from '@payloadcms/next/layouts';
import React from 'react';

import { importMap } from './admin/importMap';

import '@payloadcms/next/css';

const serverFunction: ServerFunctionClient = async function (args) {
  'use server';
  return handleServerFunctions({ ...args, config, importMap });
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <RootLayout config={config} importMap={importMap} serverFunction={serverFunction}>
      {children}
    </RootLayout>
  );
}
