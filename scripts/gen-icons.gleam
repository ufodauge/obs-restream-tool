import gleam/io
import gleam/list
import gleam/os
import gleam/result
import gleam/string

// --- Configuration ---

// The directory where the component will be placed (relative to current directory)
const output_directory = "src/components/icons"

// --- Helper Functions ---

/// Converts a file path (e.g., "path/to/close_icon.svg") to a PascalCase component name (e.g., "CloseIcon").
fn component_name_from_path(file_path: String) -> String {
  let file_name =
    file_path
    // Get filename without path
    |> string.split("/")
    |> list.last
    |> result.unwrap("icon")

  file_name
  // Remove the ".svg" extension
  |> string.replace(".svg", "")
  // Replace hyphens and underscores with spaces
  |> string.replace("-", " ")
  |> string.replace("_", " ")
  |> string.trim
  |> string.split(" ")
  |> list.map(string.capitalize)
  |> string.join("")
  |> string.append("Icon")
}

/// Extracts the inner path/group content from the full SVG string.
/// It also tries to find the viewBox attribute.
fn extract_svg_details(
  svg_content: String,
) -> result.Result(#(String, String), String) {
  let view_box_match =
    string.extract(
      svg_content,
      // Regex-like pattern to find viewBox="[...]"
      "viewBox=\"",
      "\"",
    )

  // Extract content between <svg ...> and </svg>
  let inner_content_match =
    string.extract(
      svg_content,
      // Look for <svg followed by anything until the first closing >
      "<svg[^>]*>",
      "</svg>",
    )

  case result.both(view_box_match, inner_content_match) {
    Ok(#(view_box, inner_content)) -> {
      // Clean up the inner content (remove XML declarations, comments, etc.)
      let clean_content =
        inner_content
        |> string.replace("\n", "\n  ")
        |> string.trim

      Ok(#(view_box, clean_content))
    }
    _ ->
      Error(
        "Could not find required viewBox attribute or inner SVG content in file.",
      )
  }
}

/// Generates the final TypeScript React component string.
fn generate_component_content(
  name: String,
  view_box: String,
  inner_content: String,
) -> String {
  string.join(
    [
      "type Props = {",
      "  className?: string;",
      "};",
      "",
      "export const " <> name <> " = ({ className }: Props) => (",
      "  <svg",
      "    xmlns=\"http://www.w3.org/2000/svg\"",
      "    viewBox=\"" <> view_box <> "\"",
      "    className={className}",
      "  >",
      "    " <> inner_content,
      "  </svg>",
      ");",
      "",
    ],
    "\n",
  )
}

// --- Main Script Logic ---

pub fn main() {
  let args = os.arguments()

  case args {
    [_, file_path] -> {
      // 1. Read File
      let file_content = io.read(file_path)

      // 2. Process Content
      let component_name = component_name_from_path(file_path)
      let file_name = component_name <> ".tsx"
      let output_path = string.join([output_directory, file_name], "/")

      case file_content {
        Ok(svg_content) -> {
          case extract_svg_details(svg_content) {
            Ok(#(view_box, inner_content)) -> {
              let component_code =
                generate_component_content(
                  component_name,
                  view_box,
                  inner_content,
                )

              // 3. Write File (This part requires Gleam's FFI or a build system wrapper)
              // Since Gleam's standard library does not have a public `write_file`
              // function, this is the logical place for a side-effect.
              // We will print the result and instruct the user on the final step.

              io.println("--- Generated Component Code ---")
              io.println(component_code)

              io.println("\n--- Output Instructions ---")
              io.println("1. Ensure directory exists: " <> output_directory)
              io.println("2. Manually save the code above to: " <> output_path)
            }
            Error(e) -> io.print_error("Error extracting SVG details: " <> e)
          }
        }
        Error(e) ->
          io.print_error("Error reading file " <> file_path <> ": " <> e)
      }
    }
    _ -> {
      io.print_error("Usage: gen-icon.gleam path/to/icon.svg")
    }
  }
}
