import type { CollectionConfig } from '../../collections/config/types'
import type { GlobalConfig, SanitizedGlobalConfig } from './types'

import defaultAccess from '../../auth/defaultAccess'
import sanitizeFields from '../../fields/config/sanitize'
import { fieldAffectsData } from '../../fields/config/types'
import mergeBaseFields from '../../fields/mergeBaseFields'
import translations from '../../translations'
import { toWords } from '../../utilities/formatLabels'
import baseVersionFields from '../../versions/baseFields'

const sanitizeGlobals = (
  collections: CollectionConfig[],
  globals: GlobalConfig[],
): SanitizedGlobalConfig[] => {
  const sanitizedGlobals = globals.map((global) => {
    const sanitizedGlobal = { ...global }

    sanitizedGlobal.label = sanitizedGlobal.label || toWords(sanitizedGlobal.slug)

    // /////////////////////////////////
    // Ensure that collection has required object structure
    // /////////////////////////////////

    sanitizedGlobal.endpoints = sanitizedGlobal.endpoints ?? []
    if (!sanitizedGlobal.hooks) sanitizedGlobal.hooks = {}
    if (!sanitizedGlobal.access) sanitizedGlobal.access = {}
    if (!sanitizedGlobal.admin) sanitizedGlobal.admin = {}

    if (!sanitizedGlobal.access.read) sanitizedGlobal.access.read = defaultAccess
    if (!sanitizedGlobal.access.update) sanitizedGlobal.access.update = defaultAccess

    if (!sanitizedGlobal.hooks.beforeValidate) sanitizedGlobal.hooks.beforeValidate = []
    if (!sanitizedGlobal.hooks.beforeChange) sanitizedGlobal.hooks.beforeChange = []
    if (!sanitizedGlobal.hooks.afterChange) sanitizedGlobal.hooks.afterChange = []
    if (!sanitizedGlobal.hooks.beforeRead) sanitizedGlobal.hooks.beforeRead = []
    if (!sanitizedGlobal.hooks.afterRead) sanitizedGlobal.hooks.afterRead = []

    if (sanitizedGlobal.versions) {
      if (sanitizedGlobal.versions === true) sanitizedGlobal.versions = { drafts: false }

      if (sanitizedGlobal.versions.drafts) {
        if (sanitizedGlobal.versions.drafts === true) {
          sanitizedGlobal.versions.drafts = {
            autosave: false,
          }
        }

        if (sanitizedGlobal.versions.drafts.autosave === true) {
          sanitizedGlobal.versions.drafts.autosave = {
            interval: 2000,
          }
        }

        sanitizedGlobal.fields = mergeBaseFields(sanitizedGlobal.fields, baseVersionFields)
      }
    }

    if (!sanitizedGlobal.custom) sanitizedGlobal.custom = {}

    // /////////////////////////////////
    // Sanitize fields
    // /////////////////////////////////
    let hasUpdatedAt = null
    let hasCreatedAt = null
    sanitizedGlobal.fields.some((field) => {
      if (fieldAffectsData(field)) {
        if (field.name === 'updatedAt') hasUpdatedAt = true
        if (field.name === 'createdAt') hasCreatedAt = true
      }
      return hasCreatedAt && hasUpdatedAt
    })
    if (!hasUpdatedAt) {
      sanitizedGlobal.fields.push({
        admin: {
          disableBulkEdit: true,
          hidden: true,
        },
        label: translations['general:updatedAt'],
        name: 'updatedAt',
        type: 'date',
      })
    }
    if (!hasCreatedAt) {
      sanitizedGlobal.fields.push({
        admin: {
          disableBulkEdit: true,
          hidden: true,
        },
        label: translations['general:createdAt'],
        name: 'createdAt',
        type: 'date',
      })
    }

    const validRelationships = collections.map((c) => c.slug)
    sanitizedGlobal.fields = sanitizeFields(sanitizedGlobal.fields, validRelationships)

    return sanitizedGlobal as SanitizedGlobalConfig
  })

  return sanitizedGlobals
}

export default sanitizeGlobals