import {useMemo, useCallback, useState} from 'react';
import {useFetcher, type Form as FormType} from '@remix-run/react';
import {type ReactEditor, Slate, Editable, withReact} from 'slate-react';
import {
  type BaseEditor,
  type Descendant,
  Editor,
  Text,
  Transforms,
  createEditor,
} from 'slate';

declare module 'slate' {
  interface CustomTypes {
    Editor: BaseEditor & ReactEditor;
    Element: CustomElement;
    Text: CustomText;
  }
}

type CustomText = {text: string};

type CustomElement = {type: 'paragraph'; children: CustomText[]};

type RenderLeafProps = {
  attributes: Record<string, any>;
  children: React.ReactNode;
  leaf: CustomText & {
    italic?: boolean;
    bold?: boolean;
  };
  text: CustomText;
};

type ElementProps = RenderLeafProps & {
  element?: {type: string; children: CustomText[]};
};

export default function Index() {
  const {Form, ...fetcher} = useFetcher();
  const data = fetcher?.data;
  const formSubmitted = data?.form;
  const formError = data?.error;

  return (
    <div>
      <h3>Contact Us</h3>
      {formSubmitted ? (
        <div>
          <p>Thank you for your message. We will get back to you shortly.</p>
        </div>
      ) : (
        <ContactForm Form={Form} />
      )}
      {formError && (
        <div>
          <p>There was an error submitting your message. Please try again.</p>
          <p>{formError.message}</p>
        </div>
      )}
    </div>
  );
}

function ContactForm({Form}: {Form: typeof FormType}) {
  const yyyyMmDd = new Date().toISOString().split('T')[0];
  return (
    <Form action="/api/contact-form" method="post">
      <fieldset>
        <label htmlFor="name">Name</label>
        <input type="text" name="name" required />
      </fieldset>
      <fieldset>
        <label htmlFor="email">Email</label>
        <input type="email" name="email" required />
      </fieldset>
      <fieldset>
        <label htmlFor="subject">Subject</label>
        <input type="subject" name="subject" required />
      </fieldset>
      <input type="text" hidden name="date" defaultValue={yyyyMmDd} />
      <MarkdownMessageField />
      <br />
      <button type="submit">Send</button>
    </Form>
  );
}
    
/* 
   This component is only needed if you want to support `rich_text` in the message body. 
   It would be much simpler to use a `multi_line_text` field definition for this field
   and then a simple `<textarea />` element in the form
*/
function MarkdownMessageField() {
  const [editor] = useState(() => withReact(createEditor()));
  const [ast, setAst] = useState<Descendant[]>([
    {
      type: 'paragraph',
      children: [
        {
          text: '',
        },
      ],
    },
  ]);

  // Define a leaf rendering function that is memoized with `useCallback`.
  const renderLeaf = useCallback((props: RenderLeafProps) => {
    if (props.leaf.italic) {
      return <LeafItalic {...props} />;
    }

    if (props.leaf.bold) {
      return <LeafBold {...props} />;
    }

    return <LeafDefault {...props} />;
  }, []);

  // Define a rendering function based on the element passed to `props`. We use
  const renderElement = useCallback((props: ElementProps) => {
    switch (props?.element?.type) {
      case 'code':
        return <code {...props} />;
      default:
        return <DefaultElement {...props} />;
    }
  }, []);

  // jslate markdown data
  const serialized = useMemo(() => {
    const _ast = JSON.parse(JSON.stringify(ast));
    const paragraphs = [..._ast];
    const serializedParagraphs = paragraphs.map((p) => {
      if (p?.children) {
        const children = p.children.map((s) => {
          const value = s?.text;
          const type = s?.type || 'text';
          delete s.text;
          delete s.type;

          return {value, type, ...s};
        });
        p.children = children;
      }
      return p;
    });
    return JSON.stringify({type: 'root', children: serializedParagraphs});
  }, [ast]);

  return (
    <fieldset>
      <div style={{display: 'flex'}}>
        <label htmlFor="message">Message</label>
        <div style={{marginLeft: 'auto'}}>
          <button
            onClick={(event) => {
              event.preventDefault();
            }}
            onMouseDown={(event) => {
              event.preventDefault();
              CustomEditor.toggleBoldMark(editor);
            }}
          >
            Bold
          </button>
          <button
            onClick={(event) => {
              event.preventDefault();
            }}
            onMouseDown={(event) => {
              event.preventDefault();
              CustomEditor.toggleItalicMark(editor);
            }}
          >
            Italic
          </button>
        </div>
      </div>
      <textarea
        name="message"
        hidden
        rows={12}
        required
        readOnly
        value={serialized}
      />
      <Slate
        editor={editor}
        value={ast}
        onChange={(value) => {
          const isAstChange = editor.operations.some(
            (op) => 'set_selection' !== op.type,
          );
          if (isAstChange) {
            setAst(value);
          }
        }}
      >
        <Editable
          style={{
            border: '1px solid black',
            minHeight: '200px',
            padding: '.2rem',
          }}
          renderElement={renderElement}
          renderLeaf={renderLeaf}
          onKeyDown={(event) => {
            if (!event.ctrlKey) {
              return;
            }

            // Replace the `onKeyDown` logic with our new commands.
            switch (event.key) {
              case 'i': {
                event.preventDefault();
                CustomEditor.toggleItalicMark(editor);
                break;
              }

              case 'b': {
                event.preventDefault();
                CustomEditor.toggleBoldMark(editor);
                break;
              }
            }
          }}
        />
      </Slate>
    </fieldset>
  );
}

function DefaultElement(props: ElementProps) {
  return <p {...props.attributes}>{props.children}</p>;
}

// Define our own custom set of helpers.
const CustomEditor = {
  isItalicMarkActive(editor: Editor) {
    const [match] = Editor.nodes(editor, {
      match: (n) => n?.italic === true,
      universal: true,
    });

    return !!match;
  },

  isBoldMarkActive(editor: Editor) {
    const [match] = Editor.nodes<LeadEdge>(editor, {
      match: (n) => n?.bold === true,
      universal: true,
    });

    return !!match;
  },

  toggleItalicMark(editor: Editor) {
    const isActive = CustomEditor.isItalicMarkActive(editor);
    Transforms.setNodes<RenderLeafProps['leaf']>(
      editor,
      {italic: isActive ? null : true},
      {match: (n) => Text.isText(n), split: true},
    );
  },

  toggleBoldMark(editor: Editor) {
    const isActive = CustomEditor.isBoldMarkActive(editor);
    Transforms.setNodes<RenderLeafProps['leaf']>(
      editor,
      {bold: isActive ? null : true},
      {match: (n) => Text.isText(n), split: true},
    );
  },
};

// Define a React component to render leaves with bold text.
function LeafBold(props: RenderLeafProps) {
  return props.leaf.bold ? (
    <strong {...props.attributes}>{props.children}</strong>
  ) : (
    <span {...props.attributes}>{props.children}</span>
  );
}

// Define a React component to render leaves with italic text.
function LeafItalic(props: RenderLeafProps) {
  return props.leaf.italic ? (
    <em {...props.attributes}>{props.children}</em>
  ) : (
    <span {...props.attributes}>{props.children}</span>
  );
}

function LeafDefault(props: RenderLeafProps) {
  return <span {...props.attributes}>{props.children}</span>;
}
