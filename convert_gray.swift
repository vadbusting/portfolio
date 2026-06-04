import Foundation
import CoreImage
import AppKit

let args = CommandLine.arguments
if args.count < 3 {
    print("Usage: swift convert_gray.swift <input> <output>")
    exit(1)
}
let inputPath = args[1]
let outputPath = args[2]

let context = CIContext(options: nil)
guard let url = URL(string: "file://" + inputPath.addingPercentEncoding(withAllowedCharacters: .urlPathAllowed)!),
      let inputImage = CIImage(contentsOf: url) else {
    print("Could not load image")
    exit(1)
}

let filter = CIFilter(name: "CIColorControls")!
filter.setValue(inputImage, forKey: kCIInputImageKey)
filter.setValue(0.0, forKey: kCIInputSaturationKey) // Set saturation to 0

guard let outputImage = filter.outputImage,
      let cgImage = context.createCGImage(outputImage, from: outputImage.extent) else {
    print("Failed to filter")
    exit(1)
}

let newRep = NSBitmapImageRep(cgImage: cgImage)
let data: Data?
if outputPath.lowercased().hasSuffix(".jpg") || outputPath.lowercased().hasSuffix(".jpeg") {
    data = newRep.representation(using: .jpeg, properties: [:])
} else {
    data = newRep.representation(using: .png, properties: [:])
}
try? data?.write(to: URL(fileURLWithPath: outputPath))
print("Converted \(inputPath) to grayscale")
