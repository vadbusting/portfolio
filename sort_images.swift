import Foundation
import AppKit

let fileManager = FileManager.default
let currentPath = fileManager.currentDirectoryPath

func getColorfulness(imagePath: String) -> Double {
    guard let image = NSImage(contentsOfFile: imagePath),
          let tiffData = image.tiffRepresentation,
          let bitmap = NSBitmapImageRep(data: tiffData) else {
        return 9999.0
    }
    
    // Calculate colorfulness (average max-min diff of RGB)
    let width = bitmap.pixelsWide
    let height = bitmap.pixelsHigh
    let bytesPerRow = bitmap.bytesPerRow
    let samplesPerPixel = bitmap.samplesPerPixel
    guard let bitmapData = bitmap.bitmapData else { return 9999.0 }
    
    var totalDiff: Double = 0
    var count: Double = 0
    
    // Sample every 4th pixel to speed up
    for y in stride(from: 0, to: height, by: 4) {
        for x in stride(from: 0, to: width, by: 4) {
            let offset = y * bytesPerRow + x * samplesPerPixel
            // Ensure we don't go out of bounds
            if offset + 2 < bytesPerRow * height {
                let r = Double(bitmapData[offset])
                let g = Double(bitmapData[offset + 1])
                let b = Double(bitmapData[offset + 2])
                
                let maxVal = max(r, max(g, b))
                let minVal = min(r, min(g, b))
                totalDiff += (maxVal - minVal)
                count += 1
            }
        }
    }
    
    if count == 0 { return 9999.0 }
    return totalDiff / count
}

do {
    let scriptPath = currentPath + "/script.js"
    let content = try String(contentsOfFile: scriptPath, encoding: .utf8)
    
    // Find the rawImages array using regex
    let regex = try NSRegularExpression(pattern: "const rawImages = \\[(.*?)\\];", options: [.dotMatchesLineSeparators])
    let nsRange = NSRange(content.startIndex..<content.endIndex, in: content)
    
    if let match = regex.firstMatch(in: content, options: [], range: nsRange) {
        let arrayRange = match.range(at: 1)
        if let swiftRange = Range(arrayRange, in: content) {
            let arrayContent = String(content[swiftRange])
            
            // Extract paths
            let pathRegex = try NSRegularExpression(pattern: "'([^']+)'")
            let pathMatches = pathRegex.matches(in: arrayContent, options: [], range: NSRange(arrayContent.startIndex..<arrayContent.endIndex, in: arrayContent))
            
            var paths: [String] = []
            for m in pathMatches {
                if let r = Range(m.range(at: 1), in: arrayContent) {
                    paths.append(String(arrayContent[r]))
                }
            }
            
            print("Calculating colorfulness for \(paths.count) images...")
            var scoredPaths: [(String, Double)] = []
            for p in paths {
                let fullPath = currentPath + "/" + p
                let score = getColorfulness(imagePath: fullPath)
                scoredPaths.append((p, score))
            }
            
            // Sort by colorfulness
            scoredPaths.sort { $0.1 < $1.1 }
            
            print("Top 5 least colorful:")
            for i in 0..<min(5, scoredPaths.count) {
                print(String(format: "%.2f: %@", scoredPaths[i].1, scoredPaths[i].0))
            }
            
            print("Top 5 most colorful:")
            for i in max(0, scoredPaths.count - 5)..<scoredPaths.count {
                print(String(format: "%.2f: %@", scoredPaths[i].1, scoredPaths[i].0))
            }
            
            // Generate new array content
            let newArrayContent = scoredPaths.map { "        '\($0.0)'" }.joined(separator: ",\n")
            let newRawImages = "const rawImages = [\n\(newArrayContent)\n    ];"
            
            let fullMatchRange = match.range
            if let fullSwiftRange = Range(fullMatchRange, in: content) {
                var newContent = content
                newContent.replaceSubrange(fullSwiftRange, with: newRawImages)
                
                try newContent.write(toFile: scriptPath, atomically: true, encoding: .utf8)
                print("script.js updated successfully!")
            }
        }
    }
} catch {
    print("Error: \(error)")
}
