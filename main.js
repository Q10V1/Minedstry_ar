// Arabic font support v1.5 - swaps Font internals by field name via arc.util.Reflect.
Events.on(ClientLoadEvent, () => {
    const out = [];
    function step(name, fn){
        try{ const r = fn(); out.push("OK  " + name + (r !== undefined ? ": " + r : "")); return r; }
        catch(e){ out.push("ERR " + name + ": " + e); return null; }
    }
    const Fonts = Packages.mindustry.ui.Fonts;
    const Reflect = Packages.arc.util.Reflect;
    const mod = Vars.mods.locateMod("arabic-localization");
    const ttf = mod.root.child("fonts").child("arabic.ttf");
    const Generator = Packages.arc.freetype.FreeTypeFontGenerator;
    const Param = Packages.arc.freetype.FreeTypeFontGenerator.FreeTypeFontParameter;
    const Filter = Packages.arc.graphics.Texture.TextureFilter;
    const Color = Packages.arc.graphics.Color;

    function makeFont(outline){
        const gen = new Generator(ttf);
        const p = new Param();
        p.size = 18;
        p.incremental = true;
        p.characters = "";
        p.magFilter = Filter.linear;
        p.minFilter = Filter.linear;
        if(outline){ p.borderColor = Color.darkGray; p.borderWidth = 2; }
        else{ p.shadowColor = Color.darkGray; p.shadowOffsetY = 2; }
        return gen.generateFont(p);
    }

    function swap(target, src, label){
        const names = ["data", "regions", "cache", "ownsTexture"];
        for(let i = 0; i < names.length; i++){
            const n = names[i];
            step(label + " set " + n, () => { Reflect.set(target, n, Reflect.get(src, n)); return "done"; });
        }
    }

    const defNew = step("generate def", () => makeFont(false));
    const outNew = step("generate outline", () => makeFont(true));
    if(defNew != null){
        defNew.data.markupEnabled = true;
        swap(Fonts.def, defNew, "def");
        step("FEE1 in def after swap", () => String(Fonts.def.data.hasGlyph(String.fromCharCode(0xFEE1))));
        step("same data object", () => String(Fonts.def.data == defNew.data));
    }
    if(outNew != null){
        outNew.data.markupEnabled = true;
        swap(Fonts.outline, outNew, "outline");
    }
    // ask the UI to rebuild so existing labels re-layout with the new font
    step("resize event", () => { Events.fire(new Packages.mindustry.game.EventType.ResizeEvent()); return "fired"; });

    const msg = out.join("\n");
    Log.info("[arabic-localization]\n" + msg);
});
