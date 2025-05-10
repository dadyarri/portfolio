using OgImages;
using Spectre.Console.Cli;

var app = new CommandApp<RootCommand>();
return await app.RunAsync(args);