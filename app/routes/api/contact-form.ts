import invariant from 'tiny-invariant';
import slugify from 'slugify';
import {json, type ActionArgs} from '@shopify/remix-oxygen';

export async function action({request, context}: ActionArgs) {
  const formData = await request.formData();

  const fields = Object.fromEntries(formData);

  invariant(fields.name, 'Name is required');
  invariant(fields.email, 'Email is required');
  invariant(fields.subject, 'Subject is required');
  invariant(fields.message, 'Message is required');

  const {form, error} = await createContactFormEntry({fields, context});

  console.log('form', form);
  console.log('error', error);
  if (error) {
    return json({error}, {status: 400});
  }

  return json({form});
}

async function createContactFormEntry({
  fields,
  context,
}: {
  fields: any;
  context: any;
}) {
  const METAOBJECT_UPSERT = `#graphql
    mutation metaobjectUpsert($handle: MetaobjectHandleInput!, $metaobject: MetaobjectUpsertInput!) {
      metaobjectUpsert(handle: $handle, metaobject: $metaobject) {
        metaobject {
          id
          handle
        }
        userErrors {
          field
          message
        }
      }
    }
  `;

  const metaobjectHandle = {
    handle: 'contact-form',
    type: 'contact_form',
  };

  const formHandle = slugify(Date.now() + fields.subject);
  const metaobject = {
    capabilities: {
      publishable: {
        status: 'ACTIVE',
      },
    },
    fields: [
      {
        key: 'name',
        value: fields.name,
      },
      {
        key: 'email',
        value: fields.email,
      },
      {
        key: 'date',
        value: fields.date,
      },
      {
        key: 'subject',
        value: fields.subject,
      },
      {
        key: 'message',
        value: fields.message,
      },
    ],
    handle: formHandle,
  };

  const {metaobjectUpsert} = await context.admin(METAOBJECT_UPSERT, {
    variables: {handle: metaobjectHandle, metaobject},
  });

  if (metaobjectUpsert.userErrors.length > 0) {
    const error = metaobjectUpsert.userErrors[0];
    return {form: null, error};
  }

  return {form: metaobjectUpsert.metaobject, error: null};
}
